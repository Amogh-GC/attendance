# Deploying to Vercel

This guide will help you deploy your Attendance Management System to Vercel.

## Prerequisites

- [Vercel Account](https://vercel.com/signup) (free)
- [Vercel CLI](https://vercel.com/cli) installed (optional, can deploy via GitHub)
- MongoDB Atlas database (already set up)
- Google OAuth credentials configured

## Method 1: Deploy via GitHub (Recommended)

### Step 1: Push to GitHub

Make sure your latest changes are committed and pushed:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Connect Vercel to GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `Amogh-GC/Attendance`
4. Vercel will auto-detect it's a Node.js project

### Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

**Required Variables:**

```
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/attendance_DB
SESSION_SECRET=your-session-secret-here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NODE_ENV=production
```

**Important:** Update `GOOGLE_CALLBACK_URL` based on your Vercel domain:

```
GOOGLE_CALLBACK_URL=https://your-vercel-app.vercel.app/auth/google/callback
```

### Step 4: Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your project → "APIs & Services" → "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins:**
   ```
   https://your-vercel-app.vercel.app
   ```
5. Add to **Authorized redirect URIs:**
   ```
   https://your-vercel-app.vercel.app/auth/google/callback
   ```

### Step 5: Deploy

Click "Deploy" in Vercel. It will:

- Install dependencies
- Build your application
- Deploy to a production URL

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

In your project directory:

```bash
vercel
```

Follow the prompts:

- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **attendance** (or your choice)
- Directory? **./** (current directory)
- Override settings? **N**

### Step 4: Add Environment Variables

```bash
vercel env add MONGODB_URI
vercel env add SESSION_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_CALLBACK_URL
vercel env add NODE_ENV
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

## Post-Deployment Steps

### 1. Test Your Deployment

Visit your Vercel URL: `https://your-project.vercel.app`

Test:

- ✅ Login page loads
- ✅ Register page loads
- ✅ Google OAuth sign-in works
- ✅ Local login works
- ✅ Dashboard displays correctly
- ✅ Attendance calendar functions
- ✅ User name displays correctly

### 2. Set Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Google OAuth URLs with your custom domain

### 3. Monitor Your Application

- View logs: `vercel logs` or in Vercel Dashboard
- Check function invocations and errors
- Monitor MongoDB Atlas connections

## Environment Variables Reference

| Variable               | Description                       | Example                                           |
| ---------------------- | --------------------------------- | ------------------------------------------------- |
| `MONGODB_URI`          | MongoDB Atlas connection string   | `mongodb+srv://...`                               |
| `SESSION_SECRET`       | Secret for session encryption     | Random 32+ char string                            |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID            | `xxx.apps.googleusercontent.com`                  |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret        | Your secret                                       |
| `GOOGLE_CALLBACK_URL`  | OAuth redirect URL                | `https://yourapp.vercel.app/auth/google/callback` |
| `NODE_ENV`             | Environment mode                  | `production`                                      |
| `PORT`                 | Server port (Vercel handles this) | Auto-set by Vercel                                |

## Troubleshooting

### Issue: "Cannot find module"

**Solution:** Make sure all dependencies are in `package.json` dependencies (not devDependencies).

### Issue: Google OAuth redirect_uri_mismatch

**Solution:**

- Verify callback URL in `.env` matches Google Console
- Check both JavaScript origins and redirect URIs are added
- Wait a few minutes for Google changes to propagate

### Issue: MongoDB connection fails

**Solution:**

- Verify `MONGODB_URI` is correct in Vercel environment variables
- Whitelist all IPs (0.0.0.0/0) in MongoDB Atlas Network Access
- Check database user permissions

### Issue: Session not persisting

**Solution:**

- Ensure `SESSION_SECRET` is set in Vercel
- Verify cookies are set with `secure: true` in production (already configured)
- Check browser cookie settings

### Issue: Static files (CSS/JS) not loading

**Solution:**

- Verify `vercel.json` routes are correct
- Check file paths are case-sensitive
- Ensure files are in the `public` directory

## Continuous Deployment

Once connected to GitHub, Vercel automatically deploys:

- **Production**: Every push to `main` branch
- **Preview**: Every pull request gets a preview URL

## Commands Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm deployment-url

# Check environment variables
vercel env ls

# Pull environment variables locally
vercel env pull
```

## Performance Tips

1. **Database Connection Pooling**: Already configured in `app.js`
2. **Session Store**: Consider Redis for production (currently using memory store)
3. **Static Asset Caching**: Vercel handles this automatically
4. **Function Timeout**: Default is 10s, upgrade plan for longer timeouts

## Security Checklist

- ✅ Environment variables not in code
- ✅ `.env` in `.gitignore`
- ✅ MongoDB credentials secured
- ✅ Google OAuth uses HTTPS
- ✅ Session secret is random and strong
- ✅ HTTPS enforced (Vercel does this)
- ✅ IP whitelisting on MongoDB (or 0.0.0.0/0 for Vercel)

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- Check deployment logs in Vercel Dashboard
- Review this project's [README.md](./README.md)

## Next Steps

After successful deployment:

1. Share your app URL with users
2. Monitor usage in Vercel Analytics
3. Set up custom domain (optional)
4. Configure alerts for errors
5. Plan for database backups (MongoDB Atlas)

Your app is now live! 🎉
