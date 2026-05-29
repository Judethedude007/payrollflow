'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, X } from 'lucide-react';
import { calculateNetSalary, calculateGrossSalary, sanitizeNumber, formatCurrency } from '@/utils/salary';
import type { PayrollRow } from '@/types';

interface EditRowModalProps {
  row: PayrollRow | null;
  open: boolean;
  onClose: () => void;
  onSave: (updatedRow: PayrollRow) => void;
}

interface FieldError {
  [key: string]: string;
}

export function EditRowModal({ row, open, onClose, onSave }: EditRowModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    designation: '',
    department: '',
    base_salary: '',
    hra: '',
    allowances: '',
    deductions: '',
  });
  const [errors, setErrors] = useState<FieldError>({});

  // Initialize form when row changes
  useEffect(() => {
    if (row) {
      setForm({
        name: row.name || '',
        email: row.email || '',
        designation: row.designation || '',
        department: row.department || '',
        base_salary: String(row.base_salary || 0),
        hra: String(row.hra || 0),
        allowances: String(row.allowances || 0),
        deductions: String(row.deductions || 0),
      });
      setErrors({});
    }
  }, [row]);

  // Live salary calculation
  const salaryPreview = useMemo(() => {
    const base = sanitizeNumber(form.base_salary);
    const hra = sanitizeNumber(form.hra);
    const allowances = sanitizeNumber(form.allowances);
    const deductions = sanitizeNumber(form.deductions);
    return {
      gross: calculateGrossSalary(base, hra, allowances),
      net: calculateNetSalary(base, hra, allowances, deductions),
    };
  }, [form.base_salary, form.hra, form.allowances, form.deductions]);

  const validate = (): boolean => {
    const newErrors: FieldError = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Invalid email format';
    }
    if (sanitizeNumber(form.base_salary) <= 0) newErrors.base_salary = 'Must be greater than 0';
    if (Number(form.hra) < 0) newErrors.hra = 'Cannot be negative';
    if (Number(form.allowances) < 0) newErrors.allowances = 'Cannot be negative';
    if (Number(form.deductions) < 0) newErrors.deductions = 'Cannot be negative';

    const gross = salaryPreview.gross;
    if (sanitizeNumber(form.deductions) > gross) {
      newErrors.deductions = 'Exceeds gross salary';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!row || !validate()) return;

    const base = sanitizeNumber(form.base_salary);
    const hra = sanitizeNumber(form.hra);
    const allowances = sanitizeNumber(form.allowances);
    const deductions = sanitizeNumber(form.deductions);

    const updatedRow: PayrollRow = {
      ...row,
      name: form.name.trim(),
      email: form.email.trim(),
      designation: form.designation.trim(),
      department: form.department.trim(),
      base_salary: base,
      hra,
      allowances,
      deductions,
      net_salary: calculateNetSalary(base, hra, allowances, deductions),
      gross_salary: calculateGrossSalary(base, hra, allowances),
      isValid: true,
      errors: [],
    };

    onSave(updatedRow);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Employee Row
            <Badge variant="outline" className="text-xs font-mono">
              {row.employee_id}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs">Name *</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-xs">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-designation" className="text-xs">Designation</Label>
              <Input
                id="edit-designation"
                value={form.designation}
                onChange={(e) => updateField('designation', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-department" className="text-xs">Department</Label>
              <Input
                id="edit-department"
                value={form.department}
                onChange={(e) => updateField('department', e.target.value)}
              />
            </div>
          </div>

          {/* Salary Fields */}
          <div className="border-t pt-3 mt-1">
            <p className="text-xs font-semibold text-muted-foreground mb-3">SALARY COMPONENTS</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-base" className="text-xs">Base Salary *</Label>
                <Input
                  id="edit-base"
                  type="number"
                  min="0"
                  value={form.base_salary}
                  onChange={(e) => updateField('base_salary', e.target.value)}
                  className={errors.base_salary ? 'border-destructive' : ''}
                />
                {errors.base_salary && <p className="text-xs text-destructive">{errors.base_salary}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-hra" className="text-xs">HRA</Label>
                <Input
                  id="edit-hra"
                  type="number"
                  min="0"
                  value={form.hra}
                  onChange={(e) => updateField('hra', e.target.value)}
                  className={errors.hra ? 'border-destructive' : ''}
                />
                {errors.hra && <p className="text-xs text-destructive">{errors.hra}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-allowances" className="text-xs">Allowances</Label>
                <Input
                  id="edit-allowances"
                  type="number"
                  min="0"
                  value={form.allowances}
                  onChange={(e) => updateField('allowances', e.target.value)}
                  className={errors.allowances ? 'border-destructive' : ''}
                />
                {errors.allowances && <p className="text-xs text-destructive">{errors.allowances}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-deductions" className="text-xs">Deductions</Label>
                <Input
                  id="edit-deductions"
                  type="number"
                  min="0"
                  value={form.deductions}
                  onChange={(e) => updateField('deductions', e.target.value)}
                  className={errors.deductions ? 'border-destructive' : ''}
                />
                {errors.deductions && <p className="text-xs text-destructive">{errors.deductions}</p>}
              </div>
            </div>
          </div>

          {/* Live Salary Preview */}
          <div className="rounded-lg bg-muted/50 border p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Gross Salary</p>
              <p className="text-sm font-mono font-medium">{formatCurrency(salaryPreview.gross)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Net Salary</p>
              <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(salaryPreview.net)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="gap-1.5">
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
