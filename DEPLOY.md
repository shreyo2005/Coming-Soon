# OgSenior — Deployment Guide

> **Repository:** `shreyo2005/Coming-Soon`  
> **Stack:** Spring Boot (Java 21) + PostgreSQL (Backend) | React + Vite (Frontend)  
> **Deployment targets:** Railway (backend + DB) · Vercel (frontend)

---

## Overview

```
GitHub Repo: shreyo2005/Coming-Soon
│
├── asksenior-backend/asksenior/   → deployed on Railway
└── asksenior-frontend/            → deployed on Vercel
```

---

## Step 1 — Deploy the Backend on Railway

### 1.1 Create a new Railway project

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **"New Project"** → **"Deploy from GitHub repo"**.
3. Select `shreyo2005/Coming-Soon`.
4. Railway will detect it as a Maven/Java project.

### 1.2 Set the Root Directory

In your Railway service settings:

- Go to **Settings → Source → Root Directory**
- Set it to: `asksenior-backend/asksenior`

### 1.3 Add a PostgreSQL Database

1. In the same Railway project, click **"New Service"** → **"Database"** → **"PostgreSQL"**.
2. Railway will automatically inject the following variables into your backend service:
   - `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

> ⚠️ If Railway doesn't auto-link the DB, go to your backend service → **Variables** → click **"Add Reference"** and select the Postgres service.

### 1.4 Set Environment Variables (Railway Backend Service)

Go to your backend Railway service → **Variables** tab → add each of the following:

| Variable | Value | Notes |
|---|---|---|
| `ADMIN_KEY` | `chaipiladoaurburgerkhiladokoi@123` | Change this to something strong before launch |
| `AWS_ACCESS_KEY_ID` | *(your AWS key)* | |
| `AWS_SECRET_ACCESS_KEY` | *(your AWS secret)* | |
| `AWS_S3_BUCKET` | `ogsenior-secure-uploads` | |
| `AWS_REGION` | `ap-southeast-2` | |
| `RESEND_API_KEY` | *(your Resend API key)* | |
| `CORS_ORIGINS` | `https://ogsenior.com` | Set this to your Vercel frontend URL |

> ℹ️ `PORT` is set automatically by Railway. Do not override it.

### 1.5 Get your Railway public URL

After the first successful deploy:
- Go to your backend service → **Settings** → **Networking** → **Generate Domain**
- You'll get a URL like: `https://asksenior-backend.up.railway.app`
- **Save this URL** — you'll need it for the Vercel step.

### 1.6 Add the `/api` CORS origin after Vercel deploy

Once your Vercel URL is known (e.g., `https://ogsenior.vercel.app`), come back and update:

```
CORS_ORIGINS=https://ogsenior.com,https://ogsenior.vercel.app
```

---

## Step 2 — Deploy the Frontend on Vercel

### 2.1 Import the GitHub repo

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New Project"** → import `shreyo2005/Coming-Soon`.

### 2.2 Configure the project settings

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `asksenior-frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2.3 Set Environment Variables (Vercel)

Go to **Settings → Environment Variables** in your Vercel project and add:

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `https://asksenior-backend.up.railway.app/api` | Replace with your actual Railway URL from Step 1.5 |

> ⚠️ The `/api` suffix at the end is **required** — the frontend code appends paths like `/insiders/send-otp` directly to this base URL.

### 2.4 Deploy

Click **"Deploy"**. Vercel will build and deploy your React app.  
Your live URL will be something like: `https://ogsenior.vercel.app`

---

## Step 3 — Custom Domain (optional but recommended)

### Frontend (Vercel)
1. In Vercel: **Settings → Domains → Add Domain** → enter `ogsenior.com`
2. Add the DNS records shown by Vercel to your domain registrar.

### Backend (Railway)
1. In Railway: **Settings → Networking → Custom Domain** → enter `api.ogsenior.com`
2. Add a `CNAME` record in your DNS pointing `api.ogsenior.com` → your Railway domain.
3. Then update your Vercel env variable:
   ```
   VITE_API_BASE_URL=https://api.ogsenior.com/api
   ```
4. And update `CORS_ORIGINS` in Railway:
   ```
   CORS_ORIGINS=https://ogsenior.com
   ```

---

## Environment Variables — Quick Reference

### Railway (Backend)

```env
ADMIN_KEY=<your-secure-admin-key>
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_S3_BUCKET=ogsenior-secure-uploads
AWS_REGION=ap-southeast-2
RESEND_API_KEY=<your-resend-api-key>
CORS_ORIGINS=https://ogsenior.com
# DB vars are auto-injected by Railway when you add PostgreSQL
```

### Vercel (Frontend)

```env
VITE_API_BASE_URL=https://api.ogsenior.com/api
```

---

## Deployment Order (Important!)

```
1. Deploy PostgreSQL on Railway
2. Deploy Backend on Railway  ← needs DB
3. Copy the Railway backend URL
4. Set VITE_API_BASE_URL on Vercel with the Railway URL
5. Deploy Frontend on Vercel  ← needs backend URL
6. Copy the Vercel frontend URL
7. Update CORS_ORIGINS on Railway with Vercel URL
```

---

## Pushing Updates

After making code changes locally:

```bash
# From the root of the project
git add .
git commit -m "your message"
git push origin main
```

Both Railway and Vercel are connected to GitHub and will **automatically redeploy** whenever you push to `main`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Frontend shows "Failed to fetch" | Check `VITE_API_BASE_URL` in Vercel — must match the Railway URL exactly including `/api` |
| CORS error in browser console | Add your Vercel URL to `CORS_ORIGINS` in Railway |
| Railway build fails | Check that Root Directory is set to `asksenior-backend/asksenior` |
| Flyway migration error on startup | Check that PostgreSQL is linked and `PG*` variables are populated |
| OTP emails not sending | Verify `RESEND_API_KEY` in Railway and that `support@ogsenior.com` is a verified sender in Resend dashboard |
| File uploads failing | Verify AWS credentials and that the S3 bucket exists in `ap-southeast-2` |
