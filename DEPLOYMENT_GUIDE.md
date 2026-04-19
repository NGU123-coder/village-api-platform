# Indian Village API Platform - Deployment Guide

This guide provides step-by-step instructions to deploy your full-stack SaaS project.

## Prerequisites
- A [GitHub](https://github.com/) account.
- A [Supabase](https://supabase.com/) account (for PostgreSQL).
- A [Render](https://render.com/) account (for Backend).
- A [Vercel](https://vercel.com/) account (for Frontend).

---

## 1. Database Setup (Supabase)
1. Log in to **Supabase** and create a **New Project**.
2. Go to **Project Settings** -> **Database**.
3. Copy the **Connection string** (URI). It looks like:
   `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres`
4. Replace `[YOUR-PASSWORD]` with the password you set during project creation.
5. Save this URL; you will need it for the Backend setup.

---

## 2. Backend Deployment (Render)
1. Push your code to a **GitHub repository**.
2. Log in to **Render** and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name:** `village-api-backend`
   - **Environment:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
5. Click **Advanced** and add the following **Environment Variables**:
   - `DATABASE_URL`: (Paste your Supabase URI from Step 1)
   - `JWT_SECRET`: (Any long random string, e.g., `super-secret-key-123`)
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `FRONTEND_URL`: (You will update this AFTER deploying the frontend)
6. Click **Create Web Service**.

---

## 3. Frontend Deployment (Vercel)
1. Log in to **Vercel** and click **Add New** -> **Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Project Name:** `village-api-frontend`
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://village-api-backend.onrender.com/api` 
     *(Replace with your actual Render URL, but keep the `/api` at the end)*
5. Click **Deploy**.
6. Once deployed, copy your Vercel URL (e.g., `https://village-api-frontend.vercel.app`).

---

## 4. Final Configuration & Data Import
1. **Update Backend CORS:**
   - Go back to your **Render** dashboard for the backend service.
   - Go to **Environment** and update `FRONTEND_URL` with your Vercel URL.
   - Render will automatically re-deploy.

2. **Initialize Database:**
   - On your local machine, in the `backend` folder, set your `.env` to the Supabase URI.
   - Run: `npx prisma db push`
   - This will create the tables in your production Supabase database.

3. **Import Data to Production:**
   - Open your terminal and navigate to the `backend` folder.
   - Ensure you have your Excel files in `backend/data/`.
   - Run: `npx ts-node scripts/importExcel.ts`
   - *Note: This will connect to Supabase and upload your 70k+ villages using the optimized batch script.*

---

## 5. Testing the App
1. Visit your **Vercel URL**.
2. Register a new account.
3. Log in and go to the **API Keys** page.
4. Generate a new API Key.
5. Go to the **Analytics** page (it should now load correctly).
6. Use the **Autocomplete** feature to search for villages.

---

## Troubleshooting
- **CORS Error:** Ensure `FRONTEND_URL` on Render matches your Vercel URL exactly (no trailing `/`).
- **Prisma Error:** Ensure `DATABASE_URL` is correct and the database is accessible.
- **Blank Screen:** Check the browser console (F12) for any JavaScript errors.
- **Import Failed:** Ensure Excel column names match `STATE NAME`, `DISTRICT NAME`, etc., exactly.
