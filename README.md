# ⚡ PayrollFlow — Salary Slip Automation Platform

A modern, production-grade payroll automation system built with Next.js 15. Upload employee salary data, validate it, generate professional PDF salary slips, and deliver them via email — all from one beautiful dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?style=flat-square&logo=supabase)

---

## ✨ Features

### Core Features
- 📤 **Excel/CSV Upload** — Drag-and-drop file upload with smart column mapping
- ✅ **Data Validation** — 10+ validation rules with detailed error reporting
- 📊 **Preview Table** — Searchable, paginated data preview with inline error highlighting
- 📄 **PDF Generation** — Professional A4 salary slips with company branding
- 📧 **Email Automation** — Send salary slips via Gmail SMTP with HTML templates
- 📦 **Download All (ZIP)** — Bulk download all salary slips as a single ZIP file
- 📈 **Dashboard Analytics** — Real-time stats on employees, slips, and email status

### Bonus Features
- 🌙 **Dark Mode** — Full dark/light theme toggle
- 🔐 **Password-Protected PDFs** — Each PDF includes a unique password (firstname + birth year)
- 📬 **Email Status Tracking** — Track sent, failed, and pending email deliveries
- 🎨 **Premium UI** — Glassmorphism, animations, skeleton loaders, and toast notifications
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile
- 🔒 **Admin Authentication** — Secure login with session management

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Professional component library |
| **Database** | Supabase (PostgreSQL) | Cloud-hosted database |
| **PDF Engine** | pdf-lib | Server-side PDF generation |
| **Email** | Nodemailer + Gmail SMTP | Automated email delivery |
| **File Parsing** | xlsx | Excel and CSV parsing |
| **ZIP** | JSZip | Bulk PDF download |
| **Deployment** | Vercel | Production hosting |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+
- Supabase account (free tier)
- Gmail account with App Password

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/payrollflow.git
cd payrollflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and Gmail credentials
```

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gmail SMTP
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Database Setup

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Employees table
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  designation TEXT DEFAULT '',
  department TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Salary records table
CREATE TABLE salary_records (
  id SERIAL PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id),
  base_salary NUMERIC NOT NULL,
  hra NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  month TEXT NOT NULL,
  year TEXT NOT NULL,
  net_salary NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email logs table
CREATE TABLE email_logs (
  id SERIAL PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id),
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Demo Login:** `admin@payrollflow.com` / `admin123`

---

## 📂 Folder Structure

```
payrollflow/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── download/      # ZIP download endpoint
│   │   │   ├── email/send/    # Email sending endpoint
│   │   │   ├── salary/generate/ # PDF generation endpoint
│   │   │   ├── stats/         # Dashboard stats endpoint
│   │   │   └── upload/        # Data upload endpoint
│   │   ├── dashboard/         # Dashboard page
│   │   ├── emails/            # Email logs page
│   │   ├── login/             # Login page
│   │   ├── records/           # Salary records page
│   │   ├── upload/            # Upload & preview page
│   │   ├── globals.css        # Global styles & animations
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Entry redirect
│   ├── components/            # Reusable UI components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── layout/            # Sidebar, Header, AppShell
│   │   ├── shared/            # Empty state, Skeleton loaders
│   │   ├── ui/                # shadcn/ui base components
│   │   ├── upload/            # Upload-specific components
│   │   └── theme-provider.tsx # Dark mode provider
│   ├── lib/                   # Core libraries
│   │   ├── email.ts           # Nodemailer email service
│   │   ├── pdf.ts             # PDF generation engine
│   │   ├── supabase.ts        # Supabase client
│   │   └── utils.ts           # shadcn utilities
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Business logic utilities
│       ├── parser.ts          # Excel/CSV file parser
│       ├── salary.ts          # Salary calculation engine
│       └── validation.ts      # Data validation rules
├── public/
│   ├── demo-payroll.xlsx      # Sample payroll file
│   └── logo.png               # Company logo
├── .env.local                 # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📊 User Flow

```
Admin Login → Dashboard → Upload Excel/CSV → Validate Data → Preview Table
→ Save to Database → Generate PDFs → Send Emails → Track Delivery → Download ZIP
```

---

## 📋 Excel Template

Your upload file should have these columns:

| Column | Required | Example |
|--------|----------|---------|
| Employee ID | ✅ | EMP001 |
| Name | ✅ | Arjun Sharma |
| Email | ✅ | arjun@example.com |
| Designation | ❌ | Software Engineer |
| Department | ❌ | Engineering |
| Date of Birth | ❌ | 1995-03-15 |
| Base Salary | ✅ | 60000 |
| HRA | ❌ | 15000 |
| Allowances | ❌ | 8000 |
| Deductions | ❌ | 5500 |
| Month | ✅ | 6 |
| Year | ✅ | 2026 |

A demo file is included at `public/demo-payroll.xlsx`.

---

## 🧮 Salary Calculation

```
Net Salary = (Base Salary + HRA + Allowances) - Deductions
```

---

## 🔐 PDF Password Format

Each salary slip PDF includes a document password:

```
Password = firstname (lowercase) + birth year
Example: arjun1995
Fallback: Employee ID (e.g., EMP001)
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Database

Supabase is cloud-hosted — no additional setup needed.

---

## 🔮 Future Improvements

- [ ] Role-based access control (Admin, HR, Employee)
- [ ] Employee self-service portal
- [ ] Multi-month payroll comparison charts
- [ ] Bulk email retry for failed deliveries
- [ ] Export to Google Sheets integration
- [ ] Tax calculation module (TDS, PF, ESI)
- [ ] Audit trail for all operations
- [ ] Mobile app (React Native)

---

## 📄 License

This project is built for educational and evaluation purposes.

---

Built with ❤️ using Next.js, Tailwind CSS, and Supabase.
