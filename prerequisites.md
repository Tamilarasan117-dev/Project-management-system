# Deployment Prerequisites & Instructions

This document outlines the necessary steps to deploy the CRM DIGITALIZATION system on a new machine.

## Prerequisites
Before starting, ensure the new system has the following installed:
1. **Node.js**: Download and install the latest LTS version from [nodejs.org](https://nodejs.org/). (Version 24.x recommended based on current setup).
2. **Git**: Download and install from [git-scm.com](https://git-scm.com/).

## Step-by-Step Deployment Instructions

### 1. Clone the Repository
Open a terminal (Command Prompt or PowerShell) on the new system and run:
```bash
git clone https://github.com/Tamilarasan117-dev/Project-management-system.git
cd Project-management-system
```

### 2. Set Up Environment Variables
Because `.env` files contain sensitive keys, they are not pushed to GitHub. You need to recreate them using the provided example files.

**For the Backend Server:**
1. Navigate to the `server` folder.
2. Copy the `.env.example` file and rename the copy to exactly `.env`.
3. Open the new `.env` file and replace the placeholder values with your actual Supabase URL and Anon Key.

**For the Frontend Client:**
1. Navigate to the `client` folder.
2. Copy the `.env.example` file and rename the copy to exactly `.env`.
3. Open the new `.env` file and replace the placeholder values with your actual Supabase URL and Anon Key (ensure they start with `VITE_` as shown in the example).

### 3. Install Dependencies
Go back to the root folder of the project (`Project-management-system`) and run:
```bash
npm run install:all
```
This will automatically install all necessary packages for the root, frontend, and backend.

### 4. Run the Application
You can now start the application using the batch script. 
Navigate to the `startup` folder and double-click `startup.bat`.

> **Note on `startup.bat`**: The script has been updated to dynamically detect its own path. This means you can place the cloned project folder anywhere on your new system, and the script will still find the correct directories automatically!

The script will automatically build the frontend, start the backend server, and host the frontend over your local network. You can access it via the network IPs printed in the terminal.
