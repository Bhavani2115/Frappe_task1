Here is a **professional description / project summary** you can use for your **GitHub README, Commit Description, or Mentor Submission**:

---

# 📚 Employee Training Management System (Frappe App)

### 📌 Project Overview
A custom Frappe application (`employee_training`) designed to manage, track, validate, and report on employee professional development and training programs. This project demonstrates core Frappe Framework fundamentals, custom DocTypes, controller lifecycle hooks, logging, REST/Document APIs, client scripts, interactive dialogs, data import/export pipelines, and custom Script Reports.

---

### 🚀 Key Features & Implementation Details

#### 1. Custom App & DocType Architecture
- **Custom App:** Created and installed `employee_training` on site `employee-training.localhost`.
- **Custom DocType:** Developed standard DocType **`Employee Training`** under custom module **`Employee Training`** with autonaming (`ET-.#####`).
- **13 Fields Configured:**
  - `employee_id` (Data, Mandatory)
  - `employee_name` (Data, Mandatory)
  - `department` (Select: *Engineering, Human Resources, Marketing, Sales, Finance, Operations*)
  - `training_name` (Data, Mandatory)
  - `training_type` (Select: *Technical, Soft Skills, Compliance, Leadership, Onboarding*)
  - `training_date` (Date)
  - `trainer_name` (Data)
  - `duration_hours` (Float)
  - `status` (Select: *Scheduled, In Progress, Completed, Cancelled*)
  - `is_certified` (Check)
  - `employee_email` (Data, Email Format)
  - `description` (Small Text)
  - `feedback` (Small Text)

#### 2. Backend Controller Logic & Logging (`employee_training.py`)
- **Data Validation (`validate`):**
  - Enforces RFC 5322 email syntax validation.
  - Rejects negative training duration values (`duration_hours >= 0`).
  - Strict duplicate prevention: checks and blocks duplicate registrations for the same employee and training.
- **Lifecycle Hooks & Logging (`before_save`, `on_update`):**
  - Integrated `frappe.logger("employee_training")` for structured file logging.
  - Uses `frappe.log_error()` on record updates to maintain persistent audit logs in Frappe’s `tabError Log`.
- **Whitelisted API (`get_all_trainings`):**
  - Provides a REST endpoint to query and filter training data by `employee_id`, `department`, or `status`.

#### 3. Client-Side Customizations & Interactive UI (`employee_training.js`)
- **`View All Trainings` Action Button:** Calls `get_all_trainings` API and opens a styled `frappe.ui.Dialog` table displaying records with real-time status badges and certification tags.
- **`Import CSV` Button:** Uses HTML5 `FileReader` to parse `.csv` files, map headers to DocType fields, and asynchronously import records with live progress tracking and detailed summary dialogs (imported, duplicates skipped, invalid counts).
- **`Export CSV` Button:** 1-click export generating RFC-compliant CSV files directly in the browser via Blob API.

#### 4. Analytics & Custom Script Report (`Employee Training Summary`)
- **Comprehensive Data Grid:** Displays all training metrics, attendees, dates, and hours.
- **Summary Cards:** Aggregates *Total Trainings*, *Total Hours*, *Completed Count*, and *Certified Count*.
- **Interactive Visuals:** Department-wise training distribution bar chart.
- **Dynamic Filters:** Real-time filtering by *Department*, *Training Type*, *Status*, *Date Range*, and *Certification*.
- **1-Click Export:** Toolbar buttons for instant export to **CSV** and **Excel**.

#### 5. Database Integration (MariaDB / MySQL)
- Built directly on MariaDB table `tabEmployee Training`.
- Executed multi-dimensional SQL aggregation and reporting queries (department certification rates, status breakdowns, and attendance tracking).

---

### 📂 Repository Structure
```text
employee_training/
├── employee_training/
│   ├── modules.txt
│   ├── hooks.py
│   ├── employee_training/
│   │   ├── doctype/
│   │   │   └── employee_training/
│   │   │       ├── employee_training.json
│   │   │       ├── employee_training.py
│   │   │       ├── employee_training.js
│   │   │       └── employee_training_list.js
│   │   └── report/
│   │       └── employee_training_summary/
│   │           ├── employee_training_summary.json
│   │           ├── employee_training_summary.py
│   │           └── employee_training_summary.js
│   └── public/
├── pyproject.toml
└── README.md
```
mit
