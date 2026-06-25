# Windows 10 Deployment Procedure

This document outlines the production deployment principles and step-by-step procedures for deploying the Enterprise Project Management System (EPMS) on a Windows 10 host. It utilizes **PM2** to manage the processes and dynamically adapts to whatever directory the project resides in.

---

## 1. Pre-Deployment Principles

Before running any deployment scripts, always verify:
- [ ] **Code Quality**: Ensure the `main` branch is up-to-date and all features are tested.
- [ ] **Environment**: You have the correct production Supabase URL and Keys.
- [ ] **Safety**: You have a rollback plan (e.g., reverting to a previous Git commit).

---

## 2. Prerequisites

Ensure the Windows 10 machine has the following installed:
1. **Node.js** (v18+ recommended)
2. **Git**
3. **PM2** (Process Manager) and Windows Startup hook. Open a terminal as **Administrator** and run:
   ```cmd
   npm install -g pm2
   npm install -g pm2-windows-startup
   pm2-startup install
   ```

---

## 3. Preparation & Build

1. **Clone/Navigate to Project**:
   Open a Command Prompt or PowerShell and navigate to the folder where you want the project to live.
   ```cmd
   git clone https://github.com/Tamilarasan117-dev/Project-management-system.git
   cd Project-management-system
   ```

2. **Install Dependencies**:
   ```cmd
   npm run install:all
   ```

3. **Environment Variables**:
   Create a `.env` file in the `server` directory (`server/.env`) and add your production credentials:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Build the Client**:
   ```cmd
   cd client
   npm run build
   cd ..
   ```

---

## 4. Startup Configuration (Adapts to Path)

To ensure the application dynamically adapts to wherever the project folder sits on the Windows 10 machine, we use an `ecosystem.config.js` file.

Create a file named `ecosystem.config.js` in the root of the project with the following content:

```javascript
const path = require('path');

module.exports = {
  apps: [
    {
      name: "epms-server",
      script: "npm",
      args: "run start",
      cwd: path.join(__dirname, "server"),
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "epms-client",
      script: "npm",
      args: "run preview",
      cwd: path.join(__dirname, "client"),
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
```
*Note: `__dirname` dynamically resolves the current folder path, meaning this configuration works no matter where the project is moved on the Windows machine.*

---

## 5. Execute Deployment

1. **Start the Application**:
   In the root directory of the project, run:
   ```cmd
   pm2 start ecosystem.config.js
   ```

2. **Save for Auto-Restart on Boot**:
   To ensure the application starts automatically when the Windows 10 machine reboots:
   ```cmd
   pm2 save
   ```

---

## 6. Post-Deployment Verification

**Trust, but verify.** Within the first 5 minutes of deployment, check the following:
- **Service Health**: Run `pm2 status` to ensure both `epms-server` and `epms-client` have a status of `online`.
- **Logs**: Run `pm2 logs` to check for any hidden startup errors.
- **Key User Flows**: Open a browser, navigate to `http://localhost:3000`, and ensure you can log in and view the Dashboard and Gantt Chart.
- **API Health**: Navigate to `http://localhost:5000/api/health` to confirm the backend is responding.

---

## 7. Emergency Rollback Strategy

If critical errors are discovered or performance is severely degraded:
1. **Speed over perfection**: Roll back immediately. Do not attempt to "fix forward" if the service is down.
2. **Execute Rollback**:
   ```cmd
   git checkout HEAD~1
   npm run install:all
   cd client && npm run build && cd ..
   pm2 restart all
   ```
3. **Investigate**: Check `pm2 logs` after rolling back to a stable state to understand what went wrong.
