# TransitOps — Smart Transport Operations Platform

TransitOps is a smart logistics, fleet registry, and driver safety dispatcher system built with a **Node.js/Express/MongoDB** backend and a **Vite + React** frontend. It implements fine-grained Role-Based Access Control (RBAC) across 9 distinct screens.

---

## 🏗️ Project Architecture

The repository is structured as a monorepo consisting of:
* **`/backend`**: Express server handling API routes, schemas, database connections, and role-based authorization guards.
* **`/Frontend`**: React single page application built with Vite and designed using a custom, high-fidelity dark-mode CSS system.

---

## 📜 Coding & Documentation Standards

All contributors **must** follow the rules defined in [`CODING_STANDARDS.md`](CODING_STANDARDS.md) before implementing or modifying any functions:
1. **Function Numbering**: Every function gets a unique module identifier, e.g., `FN-TRP-03`.
2. **JSDoc Header Blocks**: Every controller, route handler, and frontend function must contain a JSDoc block detailing its inputs, outputs, side effects, and thrown errors.
3. **Error String Contracts**: All thrown error messages must format as `[FN-<ID>] <ShortContext>: <human readable message>` for stack-trace-free debugging.
4. **Centralized Error Handling**: Errors must bubble to `middleware/errorHandler.js` (`FN-CORE-01`).

---

## 🚀 Getting Started

Follow these steps to set up, seed, and run the project locally.

### 1. Prerequisites
* **Node.js** (v18 or higher recommended)
* **MongoDB** (running locally on port 27017 or a remote Atlas connection string)

### 2. Configuration
Copy the environment template in the backend directory to create a `.env` configuration:
```bash
cd backend
cp .env.example .env
```
Inside `backend/.env`, configure your variables:
* `PORT`: Server port (defaults to `5000`)
* `MONGO_URI`: MongoDB connection string (defaults to `mongodb://localhost:27017/transitops`)
* `JWT_SECRET`: Signing key for authentication tokens

### 3. Install Dependencies
Run dependency installers inside both directories:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### 4. Seed the Database
Populate your database with mock vehicles, drivers, active maintenance entries, fuel logs, and test user accounts:
```bash
cd backend
node seed.js
```

---

## 🏃 Running the Application

Open two terminal windows to run both servers simultaneously:

### Start the Backend API Server
```bash
cd backend
npm run dev
```
* The API runs on `http://localhost:5000`.

### Start the Frontend Dev Server
```bash
cd Frontend
npm run dev
```
* The web app runs on `http://localhost:3000` (with built-in proxy forwarding to port 5000).

---

## 🔑 Role-Based Access Control (RBAC) Testing

Access scopes and sidebar menus dynamically update based on the logged-in user's role. Seed data provides preconfigured accounts with password **`password123`**:

| Role | Test Email | Module Access Scope |
| :--- | :--- | :--- |
| **Fleet Manager** | `manager@transitops.in` | Fleet Registry, Maintenance, Analytics, Settings (Full CRUD) |
| **Dispatcher** | `dispatcher@transitops.in` | Live Dashboard, Trip Dispatcher (Full CRUD) |
| **Safety Officer** | `safety@transitops.in` | Drivers & Safety Profiles (Full CRUD), Live Board (Read-only) |
| **Financial Analyst** | `finance@transitops.in` | Fuel Logs & Expenses (Full CRUD), Analytics (View-only) |

---

## 🖥️ Screen-by-Screen Features

* **Screen 0: Login (Auth)**: Brand split screen, email/password validation, and role-scoped session configuration.
* **Screen 1: Dashboard**: 6 fleet KPI cards, Recent Trips table, and vehicle status horizontal bar charts.
* **Screen 2: Vehicle Registry**: Search, filter, and add vehicles; retire vehicles out of active status.
* **Screen 3: Drivers & Safety**: Monitor license compliance (expired flags highlight in red), toggle driver status (Available/Off Duty/Suspended), and view safety points.
* **Screen 4: Trip Dispatcher**: Stepper navigation, Live Board, **Live capacity validation warnings** (warnings display if cargo weight exceeds maximum vehicle capacity), and route closure logs.
* **Screen 5: Maintenance**: Log active vehicle repairs (sets status to "In Shop") and close jobs to restore availability.
* **Screen 6: Fuel & Expense**: Detailed cost grid lists for diesel logs, toll charges, and maintenance costs with a grand total calculator footer.
* **Screen 7: Reports & Analytics**: Fuel efficiency rates, fleet deployment trends, and monthly revenue vertical charts.
* **Screen 8: Settings & RBAC**: Configure depot credentials and inspect the global security matrix checklist.