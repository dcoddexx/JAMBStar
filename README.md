# JAMBStar UTME Simulator

JAMBStar is a high-performance, timed Computer Based Test (CBT) preparation platform designed to help students master the Nigerian Joint Admissions and Matriculation Board (JAMB) UTME. Built with a modern React stack and powered by Supabase, it features realistic exam conditions, dynamic subject selection, and a secure administrative portal for content management.

## 🚀 Key Features

* **Realistic CBT Engine:** 45-minute timed mock exams with JAMB's standard 8-key keyboard shortcuts and interactive question palettes.
* **Smart Scoring:** Automated grading scaled to the official 400-point UTME scoring system, complete with a post-exam review mode and detailed explanations.
* **Role-Based Access Control (RBAC):** Secure routing and database-level Row Level Security (RLS) separating `student` candidate sessions from `admin` / `super_admin` accounts.
* **Admin Portal & Bulk Importer:** A protected dashboard for staff to manage users and bulk-upload thousands of past questions via CSV.
* **Monetization Ready:** Pre-configured with Google AdSense infrastructure (`ads.txt` and optimized ad banner components) for revenue generation.

## 🛠 Tech Stack

* **Frontend:** React 19, TypeScript, Vite
* **Styling:** Tailwind CSS v4
* **Routing:** React Router DOM (v6+)
* **Backend & Auth:** Supabase (PostgreSQL, Supabase Auth)
* **Hosting:** Vercel

## ⚙️ Local Development Setup

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn
* A Supabase project

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/jambstar.git](https://github.com/your-username/jambstar.git)
cd jambstar
