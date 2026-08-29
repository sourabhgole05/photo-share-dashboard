# Deployment Guide for Photo Share Dashboard

## 🚀 Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account with your repository
- Vercel account (free at vercel.com)
- GitHub Personal Access Token with repo access
- Environment variables ready

### Step 1: Push to GitHub

Make sure your local changes are committed:

```bash
git add .
git commit -m "Add filter, sort, and slideshow features"
git push origin main
```

### Step 2: Create Vercel Account & Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and choose "GitHub"
3. Authorize Vercel to access your GitHub account
4. Import your repository: `sourabhgole05/photo-share-dashboard`
5. Click "Import"

### Step 3: Configure Environment Variables in Vercel

In the Vercel project settings, add these environment variables:

```
GITHUB_TOKEN          = Your GitHub Personal Access Token
GITHUB_OWNER          = Your GitHub username (e.g., sourabhgole05)
GITHUB_REPO           = Your repository name (e.g., photo-share-dashboard)
GITHUB_BRANCH         = main
ADMIN_USERNAME        = admin (or your preferred username)
ADMIN_PASSWORD        = Create a strong password
JWT_SECRET            = Create a random secret string (use: openssl rand -base64 32)
PORT                  = 3000
```

### Step 4: Deploy

- Vercel will automatically build and deploy when you push to GitHub
- Your app will be available at: `https://your-project-name.vercel.app`

## 📱 How to Use on Mobile

### As Admin:
1. Open the app on your mobile browser
2. Click "Admin Login"
3. Enter admin credentials
4. Click "Upload Photo" to add pictures
5. Photos are automatically saved to GitHub

### Share with Family:
1. Share the app URL with your family members
2. They can click "Admin Login" 
3. Use these test credentials:
   - **Username:** `testuser` | **Password:** `test123`
   - **Username:** `viewer` | **Password:** `viewer123`
4. They can:
   - ✅ View all photos
   - ✅ Download photos
   - ✅ Filter by category
   - ✅ Watch slideshow
   - ❌ Cannot upload or delete

## 🎯 New Features

### 1. **Filter & Sort Photos**
   - Filter by category (General, Nature, Travel, Family, Events)
   - Sort by: Newest, Oldest, or Title
   - Instantly update gallery view

### 2. **Slideshow**
   - Click "Slideshow" button
   - Use arrow buttons or keyboard arrows to navigate
   - Click play/pause for auto-play (3-second interval)
   - Press ESC to exit

### 3. **Better Thumbnail View**
   - Responsive grid layout
   - Works perfectly on mobile devices
   - Smooth hover effects
   - Shows photo metadata (category, date, uploader, size)

## 🔐 Security Notes

- GitHub token is stored securely in Vercel
- All environment variables are encrypted
- Passwords are hashed with bcrypt
- JWT tokens expire after 24 hours

## 🆘 Troubleshooting

### Photos not uploading?
- Check GitHub token is valid
- Verify GitHub repo name is correct
- Ensure repo is public or token has access

### Login not working?
- Clear browser cache and cookies
- Try incognito/private mode
- Check JWT_SECRET is set

### Slideshow not working?
- Ensure you have at least 1 photo uploaded
- Try refreshing the page
- Check browser supports ES6

## 📝 Local Testing Before Deployment

```bash
# Install dependencies
npm install

# Create .env file with all variables (see DEPLOYMENT steps)
cat > .env << EOF
GITHUB_TOKEN=your_token
GITHUB_OWNER=your_username
GITHUB_REPO=photo-share-dashboard
GITHUB_BRANCH=main
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your_secret
PORT=3000
EOF

# Run locally
npm start

# Visit http://localhost:3000
```

## 📞 Support

For issues:
1. Check browser console for errors (F12)
2. Check Vercel deployment logs
3. Verify all environment variables are set
4. Test locally with `npm start` first

---

**Enjoy secure photo sharing with your family! 📸**
