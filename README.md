# 📸 Secure Photo Share Dashboard

A full-stack web application for securely uploading, viewing, and managing photos with role-based access control. Perfect for sharing family photos with limited permissions!

## ✨ Features

### 🔐 Security & Access Control
- JWT-based authentication with 24-hour tokens
- Secure password hashing with bcryptjs
- Role-based access control (Admin vs User)
- GitHub-backed storage

### 📤 Photo Management (Admin Only)
- Upload photos to GitHub repository
- Support for: JPG, JPEG, PNG, GIF, WebP, HEIC, HEIF
- Max file size: 10 MB
- Add title, description, and category
- Delete photos from gallery

### 📸 Photo Viewing (All Users)
- Beautiful responsive gallery layout
- Filter photos by category
- Sort by date (newest/oldest) or title
- Automatic slideshow with navigation
- Auto-play with 3-second interval
- View photo details (size, date, uploader)
- Download photos locally

### 📱 Mobile-Friendly
- Fully responsive design
- Optimized for phones, tablets, and desktops
- Touch-friendly controls
- Lightweight and fast

### 🎛️ Gallery Controls
- **Filter by Category**: General, Nature, Travel, Family, Events
- **Sort Options**: Newest First, Oldest First, By Title
- **Slideshow Mode**: Full-screen photo viewing with auto-play
- **Download**: Save photos to your device

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your GitHub credentials and admin password
nano .env

# Run the server
npm start
```

Visit `http://localhost:3000` in your browser.

### Test Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Test User Accounts (View Only):**
- Username: `testuser` | Password: `test123`
- Username: `viewer` | Password: `viewer123`

## 🌐 Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project" and select your repository
4. Add environment variables (see [DEPLOYMENT.md](DEPLOYMENT.md))
5. Click Deploy!

**[→ Full Deployment Guide](DEPLOYMENT.md)**

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: JWT + bcryptjs
- **Storage**: GitHub API (Octokit)
- **Deployment**: Vercel

## 📋 Environment Variables

```env
# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repository_name
GITHUB_BRANCH=main

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_random_secret_string

# Server
PORT=3000
```

## 📁 Project Structure

```
photo-share-dashboard/
├── public/
│   ├── index.html          # Main UI
│   └── script.js           # Frontend logic
├── server.js               # Express backend
├── vercel.json            # Vercel config
├── DEPLOYMENT.md          # Deployment guide
├── package.json           # Dependencies
└── .env.example           # Example env file
```

## 🔄 How It Works

1. **Admin uploads photo** → Sends to backend
2. **Backend processes image** → Uploads to GitHub via Octokit API
3. **Photo metadata saved** → Stored in server memory
4. **All users can view** → Gallery loads photos from GitHub
5. **Test users can only view/download** → No upload/delete permissions

## 🔑 Permissions Matrix

| Feature | Admin | Regular User |
|---------|:-----:|:-----:|
| View Photos | ✅ | ✅ |
| Download Photos | ✅ | ✅ |
| Filter & Sort | ✅ | ✅ |
| Slideshow | ✅ | ✅ |
| Upload Photos | ✅ | ❌ |
| Delete Photos | ✅ | ❌ |
| Manage Users | ✅ | ❌ |

## 🖼️ Screenshots

### Admin Dashboard
- Upload button visible
- Photo management controls
- Delete options for each photo

### User Gallery
- Beautiful thumbnail grid
- Filter and sort controls
- View and download buttons
- Slideshow mode

## 🐛 Troubleshooting

**Photos not uploading?**
- Verify GitHub token is valid
- Check GitHub owner and repo name
- Ensure repo is accessible

**Login not working?**
- Clear browser cache
- Check .env variables are set
- Try incognito mode

**Slideshow frozen?**
- Refresh the page
- Check browser console for errors
- Ensure photos are loaded

## 📝 License

MIT License - Feel free to use for personal or commercial projects

## 🤝 Contributing

Contributions welcome! Feel free to submit issues and pull requests.

---

**Made with ❤️ for sharing family memories securely** 📸
