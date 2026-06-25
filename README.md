# Enterprise Project Management System (EPMS)

An elegant, high-performance Project Management dashboard designed with a modern **Glassmorphism** UI. The system supports projects, interactive Gantt charts, milestones, tasks, team management, daily progress reports (DPR), budget tracking, and billing.

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database / Auth**: Supabase (PostgreSQL)

---

## 🛠️ Local Development Setup

Follow these instructions to run the application locally on your machine.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/Tamilarasan117-dev/Project-management-system.git
cd Project-management-system
```

### 3. Install Dependencies
The project uses a mono-repo structure. You can install both client and server dependencies with a single command:
```bash
npm run install:all
```

### 4. Environment Configuration
You need to connect the application to a Supabase backend.
1. Go to the `server` folder.
2. Create a file named `.env`.
3. Copy the contents of the root `.env.example` file into your new `.env` file and fill in your Supabase credentials:

```env
PORT=5000
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 5. Start the Application
To run both the frontend and backend simultaneously in development mode:
```bash
npm run dev
```

- **Client** will be available at: `http://localhost:3000`
- **Server API** will be available at: `http://localhost:5000`

---

## 🚢 Production Deployment

This project includes a detailed deployment guide tailored for **Windows 10** using PM2. 

Please see the [deployment_procedure.md](./deployment_procedure.md) file in the root of this repository for step-by-step instructions on how to build, deploy, verify, and maintain the application in a production environment.

---

## 🎨 UI Design System

The application utilizes a strictly enforced **Glassmorphism** design system:
- Soft, luminous atmospheric gradients.
- Translucent frosted glass cards and panels with `backdrop-filter`.
- Crisp inner highlights and deep, diffused ambient shadows.
- Vivid accent colors against a calm, premium backdrop.
