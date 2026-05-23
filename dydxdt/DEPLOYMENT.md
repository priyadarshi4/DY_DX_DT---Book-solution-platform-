# Deployment Guide — Dy_Dx_Dt

Complete step-by-step deployment for:
- **Backend** → Render.com
- **Frontend** → Vercel
- **Database** → MongoDB Atlas
- **Media** → Cloudinary

---

## Step 1: MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free account
2. Create a **Free M0** cluster (AWS, any region)
3. Under **Database Access** → Add a user with password → Save credentials
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — required for Render)
5. Click **Connect** → **Connect your application** → Copy connection string

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dydxdt
   ```

---

## Step 2: Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com) → Create free account
2. From Dashboard, copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## Step 3: Deploy Backend to Render

1. Push the entire `dydxdt/` project to a **GitHub repository**

2. Go to [render.com](https://render.com) → New → **Web Service**

3. Connect your GitHub repo, select the `backend/` subdirectory:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Node Version**: 18+

4. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `PORT` | `5000` |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `mongodb+srv://...` |
   | `JWT_SECRET` | `your-long-random-secret-string` |
   | `JWT_EXPIRE` | `7d` |
   | `FRONTEND_URL` | *(set after Vercel deploy)* |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary |
   | `CLOUDINARY_API_KEY` | from Cloudinary |
   | `CLOUDINARY_API_SECRET` | from Cloudinary |

5. Click **Deploy**. Note your Render URL: `https://dydxdt-backend.onrender.com`

6. Create admin user:
   ```bash
   # After deployment, you can run seed via Render Shell or locally:
   cd backend
   MONGODB_URI=your_uri ADMIN_EMAIL=admin@you.com ADMIN_PASSWORD=YourPass node seed.js
   ```

---

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project

2. Import your GitHub repo → Set **Root Directory** to `frontend`

3. **Build Settings** (auto-detected for Next.js):
   - Framework: Next.js
   - Build: `npm run build`
   - Output: `.next`

4. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://dydxdt-backend.onrender.com/api` |

5. Click **Deploy**. Note your Vercel URL: `https://dydxdt.vercel.app`

6. Go back to Render → Update `FRONTEND_URL` env var to your Vercel URL → Redeploy

---

## Step 5: Post-Deployment Verification

### Test the API
```bash
# Health check
curl https://dydxdt-backend.onrender.com/api/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

### Test Authentication
```bash
curl -X POST https://dydxdt-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@you.com","password":"YourPass"}'
```

### Verify Frontend
- Visit your Vercel URL
- Navigate to `/auth/login` and sign in as admin
- Check `/admin` dashboard loads
- Add a test book at `/admin/books`

---

## Custom Domain Setup

### Vercel Custom Domain
1. Vercel Dashboard → Project Settings → Domains
2. Add your domain (e.g. `dydxdt.com`)
3. Update DNS records as instructed

### Update CORS
After adding custom domain, update Render env:
```
FRONTEND_URL=https://dydxdt.com
```

---

## Environment Reference

### Backend `.env`
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dydxdt
JWT_SECRET=super-long-random-secret-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend.vercel.app

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz

ADMIN_EMAIL=admin@dydxdt.com
ADMIN_PASSWORD=Admin@SecurePass123
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

---

## Monitoring & Logs

- **Render logs**: Dashboard → Your Service → Logs tab
- **Vercel logs**: Dashboard → Deployments → Click deployment → Functions tab
- **MongoDB Atlas logs**: Atlas → Monitoring tab

---

## Free Tier Limits

| Service | Free Tier |
|---|---|
| MongoDB Atlas M0 | 512MB storage, shared |
| Render Web Service | 750 hrs/month, spins down after 15min inactivity |
| Vercel Hobby | 100GB bandwidth, unlimited deploys |
| Cloudinary | 25GB storage, 25GB bandwidth/month |

> **Note on Render free tier**: The backend may take 30-60 seconds to wake up after inactivity. Consider upgrading to a paid plan ($7/mo) for production.
