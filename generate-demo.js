const XLSX = require('xlsx');

const employees = [
  ['Employee ID','Name','Email','Designation','Department','Date of Birth','Base Salary','HRA','Allowances','Deductions','Month','Year'],
  ['EMP001','Arjun Sharma','arjun.sharma@example.com','Software Engineer','Engineering','1995-03-15',60000,15000,8000,5500,'6','2026'],
  ['EMP002','Priya Patel','priya.patel@example.com','Product Manager','Product','1993-07-22',80000,20000,12000,8000,'6','2026'],
  ['EMP003','Rahul Verma','rahul.verma@example.com','Data Analyst','Analytics','1997-11-08',55000,13750,6000,4200,'6','2026'],
  ['EMP004','Sneha Gupta','sneha.gupta@example.com','UI/UX Designer','Design','1996-01-30',58000,14500,7500,4800,'6','2026'],
  ['EMP005','Vikram Singh','vikram.singh@example.com','DevOps Engineer','Engineering','1994-05-12',72000,18000,10000,6500,'6','2026'],
  ['EMP006','Ananya Reddy','ananya.reddy@example.com','HR Manager','Human Resources','1992-09-18',65000,16250,9000,5800,'6','2026'],
  ['EMP007','Karthik Nair','karthik.nair@example.com','Backend Developer','Engineering','1998-02-25',56000,14000,7000,4500,'6','2026'],
  ['EMP008','Meera Iyer','meera.iyer@example.com','QA Lead','Quality Assurance','1991-12-03',68000,17000,9500,6200,'6','2026'],
  ['EMP009','Aditya Joshi','aditya.joshi@example.com','Marketing Specialist','Marketing','1996-06-14',52000,13000,6500,3900,'6','2026'],
  ['EMP010','Divya Menon','divya.menon@example.com','Finance Analyst','Finance','1994-10-27',62000,15500,8500,5200,'6','2026'],
];

const ws = XLSX.utils.aoa_to_sheet(employees);
ws['!cols'] = [
  {wch:14},{wch:18},{wch:28},{wch:22},{wch:18},{wch:14},{wch:14},{wch:10},{wch:12},{wch:12},{wch:8},{wch:8}
];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
XLSX.writeFile(wb, 'public/demo-payroll.xlsx');
console.log('Demo payroll file generated!');
