require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Octokit } = require('@octokit/rest');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = '1.1.0'; // Force redeploy

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Additional CORS headers for mobile support
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

let users = [
  {
    id:  1,
    username: process.env.ADMIN_USERNAME || 'admin',
    password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
    role: 'admin'
  },
  {
    id: 2,
    username: 'testuser',
    password: bcrypt.hashSync('test123', 10),
    role: 'user'
  },
  {
    id: 3,
    username: 'viewer',
    password: bcrypt.hashSync('viewer123', 10),
    role: 'user'
  }
];

let photos = [];
let nextPhotoId =  1;

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(
    token,
    JWT_SECRET,
    (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    }
  );
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Add cache control headers for mobile
    res.header('Cache-Control', 'no-cache');
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    // Add cache control headers for mobile
    res.header('Cache-Control', 'no-cache');
    res.json({
      user: { id: req.user.id, username: req.user.username, role: req.user.role }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/photos/upload', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { filename, base64Data, title, description, category, uploader } = req.body;

    if (!filename || !base64Data) {
      return res.status(400).json({ error: 'Filename and image data required' });
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
    const fileExtension = path.extname(filename.toLowerCase());

    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: JPG, JPEG, PNG, GIF, WebP, HEIC' });
    }

    const base64DataWithoutPrefix = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64DataWithoutPrefix, 'base64');

    const MAX_SIZE = 10 * 1024 * 1024;
    if (imageBuffer.length > MAX_SIZE) {
      return res.status(400).json({ error: 'Image size exceeds the 10 MB limit' });
    }

    // Check GitHub token
    if (!process.env.GITHUB_TOKEN) {
      return res.status(500).json({ error: 'GitHub token not configured. Contact administrator.' });
    }

    if (!process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      return res.status(500).json({ error: 'GitHub repository not configured. Contact administrator.' });
    }

    const uniqueFilename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${fileExtension}`;
    const filePathInRepo = `photos/${uniqueFilename}`;

    try {
      const ghResponse = await octokit.rest.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePathInRepo,
        message: `Upload photo: ${title || filename}`,
        content: imageBuffer.toString('base64'),
        branch: process.env.GITHUB_BRANCH || 'main'
      });

      const photo = {
        id: nextPhotoId++,
        filename: uniqueFilename,
        sha: ghResponse.data.content.sha,
        title: title || filename,
        description: description || '',
        category: category || 'General',
        uploader: uploader || req.user.username,
        uploadedAt: new Date().toISOString(),
        url: `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH || 'main'}/${filePathInRepo}`,
        size: imageBuffer.length
      };

      photos.push(photo);

      res.status(201).json({
        message: 'Photo uploaded successfully',
        photo
      });
    } catch (githubError) {
      console.error('GitHub API error:', githubError.message);
      return res.status(500).json({ 
        error: 'Failed to upload to GitHub. Please check your GitHub token and repository settings.' 
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo: ' + error.message });
  }
});

app.get('/api/photos', (req, res) => {
  try {
    // Send with no-cache headers for mobile
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    // Ensure photos is an array
    const photosData = Array.isArray(photos) ? photos : [];
    res.json(photosData);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.json([]);
  }
});

app.get('/api/photos/:id', (req, res) => {
  const photo = photos.find(p => p.id === parseInt(req.params.id));

  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  res.json(photo);
});

app.delete('/api/photos/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const photoId = parseInt(req.params.id);
    const photoIndex = photos.findIndex(p => p.id === photoId);

    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photos[photoIndex];

    try {
      await octokit.rest.repos.deleteFile({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: `photos/${photo.filename}`,
        message: `Delete photo: ${photo.title}`,
        branch: process.env.GITHUB_BRANCH || 'main',
        sha: photo.sha
      });
    } catch (githubError) {
      console.error('GitHub delete error:', githubError);
    }

    photos.splice(photoIndex, 1);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(
  PORT,
  () => {
    console.log('Server running on http://localhost:' + PORT);
    console.log('Admin: ' + (process.env.ADMIN_USERNAME || 'admin'));
    console.log('GitHub: ' + process.env.GITHUB_OWNER + '/' + process.env.GITHUB_REPO);
  }
);