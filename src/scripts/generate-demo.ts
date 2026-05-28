// ============================================================
// Demo Data Generator — Creates a sample Excel file with 10 employees
// Run: npx ts-node --esm src/scripts/generate-demo.ts
// ============================================================

import * as XLSX from 'xlsx';
import * as path from 'path';

const demoEmployees = [
  {
    'Employee ID': 'EMP001',
    'Name': 'Arjun Sharma',
    'Email': 'arjun.sharma@example.com',
    'Designation': 'Software Engineer',
    'Department': 'Engineering',
    'Date of Birth': '1995-03-15',
    'Base Salary': 60000,
    'HRA': 15000,
    'Allowances': 8000,
    'Deductions': 5500,
    'Month': '6',
    'Year': '2026',
  },
  {
    'Employee ID': 'EMP002',
    'Name': 'Priya Patel',
    'Email': 'priya.patel@example.com',
    'Designation': 'Product Manager',
    'Department': 'Product',
    'Date of Birth': '1993-07-22',
    'Base Salary': 80000,
    'HRA': 20000,
    'Allowances': 12000,
    'Deductions': 8000,
    'Month': '6',
    'Year': '2026',
  },
  {
    'Employee ID': 'EMP003',
    'Name': 'Rahul Verma',
    'Email': 'rahul.verma@example.com',
    'Designation': 'Data Analyst',
    'Department': 'Analytics',
    'Date of Birth': '1997-11-08',
    'Base Salary': 55000,
    'HRA': 13750,
    'Allowances': 6000,
    'Deductions': 4200,
    'Month': '6',
    'Year': '2026',
  },
  {
    'Employee ID': 'EMP004',
    'Name': 'Sneha Gupta',
    'Email': 'sneha.gupta@example.com',
    'Designation': 'UI/UX Designer',
    'Department': 'Design',
    'Date of Birth': '1996-01-30',
    'Base Salary': 58000,
    'HRA': 14500,
    'Allowances': 7500,
    'Deductions': 4800,
    'Month': '6',
    'Year': '2026',
  },
  {
    'Employee ID': 'EMP005',
    'Name': 'Vikram Singh',
    'Email': 'vikram.singh@example.com',
    'Designation': 'DevOps Engineer',
    'Department': 'Engineering',
    'Date of Birth': '1994-05-12',
    'Base Salary': 72000,
    'HRA': 18000,
    'Allowances': 10000,
    'Deductions': 6500,
    'Month': '6',
    'Year': '2026',
  },
  {
    'Employee ID': 'EMP006',
    'Name': 'Ananya Reddy',
    'Email': 'ananya.reddy@example.com',
    'Designation': 'HR Manager',
    'Department': 'Human Resources',
    'Date of Birth': '1992-09-18',
    'Base Salary': 65000,
    'HRA': 16250,
    'Allowances': 9000,
    'Deductions': 5800,
    'Month': '6',
    'Year': '2026',
  },
  {
    'Employee ID': 'EMP007',
    'Name': 'Karthik Nair',
    'Email': 'karthik.nair@example.com',
    'Designation': 'Backend Developer',
    'Department': 'Engineering',
    'Date of Birth': '1998-02-25',
    'Base Salary': 56000,
    'HRA': 14000,
    'Allowances': 7000,
    'Deductions': 4500,
    'Month': '6',
    'Year': '2026',
  },
  {
    'Employee ID': 'EMP008',
    'Name': 'Meera Iyer',
    'Email': 'meera.iyer@example.com',
    'Designation': 'QA Lead',
    'Department': 'Quality Assurance',
    'Date of Birth': '1991-12-03',
    'Base Salary': 68000,
    'HRA': 17000,
    'Allowances': 9500,
    'Deductions': 6200,
    'Month': '6',
    'Year': '2026',
  },
  {
    'Employee ID': 'EMP009',
    'Name': 'Aditya Joshi',
    'Email': 'aditya.joshi@example.com',
    'Designation': 'Marketing Specialist',
    'Department': 'Marketing',
    'Date of Birth': '1996-06-14',
    'Base Salary': 52000,
    'HRA': 13000,
    'Allowances': 6500,
    'Deductions': 3900,
    'Month': '6',
    'Year': '2026',
  },
  {
    'Employee ID': 'EMP010',
    'Name': 'Divya Menon',
    'Email': 'divya.menon@example.com',
    'Designation': 'Finance Analyst',
    'Department': 'Finance',
    'Date of Birth': '1994-10-27',
    'Base Salary': 62000,
    'HRA': 15500,
    'Allowances': 8500,
    'Deductions': 5200,
    'Month': '6',
    'Year': '2026',
  },
];

// Generate the Excel workbook
const worksheet = XLSX.utils.json_to_sheet(demoEmployees);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');

// Column widths for readability
worksheet['!cols'] = [
  { wch: 14 }, // Employee ID
  { wch: 18 }, // Name
  { wch: 28 }, // Email
  { wch: 22 }, // Designation
  { wch: 18 }, // Department
  { wch: 14 }, // DOB
  { wch: 14 }, // Base Salary
  { wch: 10 }, // HRA
  { wch: 12 }, // Allowances
  { wch: 12 }, // Deductions
  { wch: 8 },  // Month
  { wch: 8 },  // Year
];

const outputPath = path.join(process.cwd(), 'public', 'demo-payroll.xlsx');
XLSX.writeFile(workbook, outputPath);
console.log(`✅ Demo payroll file generated at: ${outputPath}`);
