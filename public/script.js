class PhotoDashboard {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.photos = [];
        this.filteredPhotos = [];
        this.currentSlideshowIndex = 0;
        this.currentSlideshowPhoto = null;
        this.slideshowAutoPlay = false;
        this.slideshowInterval = null;
        this.init();
    }

    async init() {
        this.checkAuthStatus();
        await this.loadPhotos();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadPhoto();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Filter and Sort listeners
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.applyFiltersAndSort();
        });

        document.getElementById('sortBy').addEventListener('change', () => {
            this.applyFiltersAndSort();
        });

        // Keyboard controls for slideshow
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('slideshowModal').classList.contains('show')) return;
            if (e.key === 'ArrowRight') this.nextSlide();
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'Escape') this.stopSlideshow();
        });
    }

    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            this.authToken = token;
            this.verifyToken();
        }
    }

    async verifyToken() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.updateUI();
            } else {
                localStorage.removeItem('authToken');
                this.authToken = null;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('authToken');
            this.authToken = null;
        }
    }

    updateUI() {
        const userSection = document.getElementById('userSection');
        const loginSection = document.getElementById('loginSection');
        const loginRequired = document.getElementById('loginRequired');
        const gallery = document.getElementById('gallery');
        const filterControls = document.getElementById('filterControls');

        if (this.currentUser) {
            userSection.style.display = 'flex';
            loginSection.style.display = 'none';
            loginRequired.style.display = 'none';

            document.getElementById('userAvatar').textContent =
                this.currentUser.username.charAt(0).toUpperCase();
            document.getElementById('userName').textContent = this.currentUser.username;
            document.getElementById('userRole').textContent = this.currentUser.role;

            if (this.currentUser.role === 'admin') {
                gallery.innerHTML = this.getAdminGalleryHTML();
            } else {
                gallery.innerHTML = this.getUserGalleryHTML();
            }
            
            // Show filter controls if there are photos
            filterControls.style.display = this.photos.length > 0 ? 'block' : 'none';
        } else {
            userSection.style.display = 'none';
            loginSection.style.display = 'block';
            loginRequired.style.display = 'block';
            gallery.innerHTML = '';
            filterControls.style.display = 'none';
        }
    }

    getAdminGalleryHTML() {
        return `
            <div style="grid-column: 1/-1; background: linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%); padding: 2rem; border-radius: 10px; margin-bottom: 2rem; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.8rem;">📸 Photo Management</h2>
                        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Welcome, <strong>${this.currentUser.username}</strong>! Manage your family photos.</p>
                    </div>
                    <button class="btn btn-primary" onclick="dashboard.openModal('uploadModal')" style="background: white; color: var(--accent); border: none;">
                        <i class="fas fa-upload"></i> Upload Photo
                    </button>
                </div>
            </div>
            <div style="grid-column: 1/-1; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="background: var(--card); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
                    <div style="font-size: 2rem; color: var(--accent); margin-bottom: 0.5rem;">📊</div>
                    <div style="font-size: 0.9rem; color: var(--muted);">Total Photos</div>
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--text);">${this.photos.length}</div>
                </div>
                <div style="background: var(--card); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
                    <div style="font-size: 2rem; color: var(--success); margin-bottom: 0.5rem;">👥</div>
                    <div style="font-size: 0.9rem; color: var(--muted);">Users</div>
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--text);">3</div>
                </div>
                <div style="background: var(--card); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
                    <div style="font-size: 2rem; color: var(--warning); margin-bottom: 0.5rem;">🔒</div>
                    <div style="font-size: 0.9rem; color: var(--muted);">Security</div>
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--text);">256-bit</div>
                </div>
            </div>
            <div style="grid-column: 1/-1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>Your Photos</h3>
                <span style="font-size: 0.9rem; color: var(--muted);">${this.filteredPhotos.length} photos found</span>
            </div>
            <div id="photosContainer" style="grid-column: 1/-1;">
                ${this.filteredPhotos.length > 0 ? this.filteredPhotos.map(photo => this.getPhotoCardHTML(photo, true)).join('') : '<p style="color: var(--muted); text-align: center; grid-column: 1/-1; padding: 2rem;">No photos yet. Start by uploading your first photo! 📸</p>'}
            </div>
        `;
    }

    getUserGalleryHTML() {
        return `
            <div style="grid-column: 1/-1; background: linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%); padding: 2rem; border-radius: 10px; margin-bottom: 2rem; color: white;">
                <h2 style="margin: 0; font-size: 1.8rem;">📸 Photo Gallery</h2>
                <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Welcome, <strong>${this.currentUser.username}</strong>! Browse and download photos.</p>
            </div>
            <div style="grid-column: 1/-1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>Shared Photos</h3>
                <span style="font-size: 0.9rem; color: var(--muted);">${this.filteredPhotos.length} photos available</span>
            </div>
            <div id="photosContainer" style="grid-column: 1/-1;">
                ${this.filteredPhotos.length > 0 ? this.filteredPhotos.map(photo => this.getPhotoCardHTML(photo, false)).join('') : '<p style="color: var(--muted); text-align: center; grid-column: 1/-1; padding: 2rem;">No photos to display yet. Check back soon! 📸</p>'}
            </div>
        `;
    }

    getPhotoCardHTML(photo, isAdmin) {
        return `
            <div class="photo-card">
                <img src="${photo.url}" alt="${photo.title}" class="photo-img"
                     onclick="dashboard.viewPhoto(${photo.id})">
                <div class="photo-info">
                    <div class="photo-title">${photo.title}</div>
                    <div class="photo-meta">
                        <span>${photo.category}</span>
                        <span>${new Date(photo.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="photo-meta">
                        <span>By: ${photo.uploader}</span>
                        <span>${(photo.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div class="photo-actions">
                        <button class="btn btn-secondary btn-small" onclick="dashboard.viewPhoto(${photo.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="dashboard.downloadPhoto(${photo.id})">
                            <i class="fas fa-download"></i> Download
                        </button>
                        ${isAdmin ? `
                            <button class="btn btn-danger btn-small" onclick="dashboard.deletePhoto(${photo.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', data.token);
                this.closeModal('loginModal');
                this.updateUI();
                this.showNotification('Login successful!', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        this.authToken = null;
        this.currentUser = null;
        this.updateUI();
        this.showNotification('Logged out successfully', 'info');
    }

    async uploadPhoto() {
        const file = document.getElementById('photoFile').files[0];
        const title = document.getElementById('photoTitle').value;
        const description = document.getElementById('photoDescription').value;
        const category = document.getElementById('photoCategory').value;

        if (!file) {
            this.showNotification('Please select a file', 'error');
            return;
        }

        // Validate file size
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            this.showNotification('File size exceeds 10 MB limit', 'error');
            return;
        }

        // Validate file type
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            this.showNotification('Invalid file type. Allowed: JPG, PNG, GIF, WebP, HEIC', 'error');
            return;
        }

        try {
            // Show loading state
            const submitBtn = document.querySelector('#uploadForm button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            submitBtn.disabled = true;

            const base64Data = await this.fileToBase64(file);

            // Ensure token exists
            if (!this.authToken) {
                throw new Error('Authentication token expired. Please login again.');
            }

            const response = await fetch('/api/photos/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    filename: file.name,
                    base64Data: base64Data,
                    title: title || file.name,
                    description: description,
                    category: category,
                    uploader: this.currentUser.username
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.photos.unshift(result.photo);
                this.applyFiltersAndSort();
                this.closeModal('uploadModal');
                this.showNotification('✅ Photo uploaded successfully!', 'success');
                document.getElementById('uploadForm').reset();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification(error.message || 'Failed to upload photo', 'error');
        } finally {
            // Restore button state
            const submitBtn = document.querySelector('#uploadForm button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload to GitHub';
            submitBtn.disabled = false;
        }
    }

    async deletePhoto(photoId) {
        if (!confirm('Are you sure you want to delete this photo?')) {
            return;
        }

        try {
            const response = await fetch(`/api/photos/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.photos = this.photos.filter(p => p.id !== photoId);
                this.applyFiltersAndSort();
                this.showNotification('Photo deleted successfully', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Delete failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    viewPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        document.getElementById('imageViewerTitle').textContent = photo.title;
        document.getElementById('imageViewerImg').src = photo.url;
        document.getElementById('imageViewerInfo').innerHTML = `
            <p><strong>Category:</strong> ${photo.category}</p>
            <p><strong>Uploaded by:</strong> ${photo.uploader}</p>
            <p><strong>Date:</strong> ${new Date(photo.uploadedAt).toLocaleString()}</p>
            <p><strong>Size:</strong> ${(photo.size / 1024).toFixed(1)} KB</p>
            ${photo.description ? `<p><strong>Description:</strong> ${photo.description}</p>` : ''}
        `;

        this.openModal('imageViewerModal');
    }

    downloadPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        const a = document.createElement('a');
        a.href = photo.url;
        a.download = photo.title || 'photo.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        this.showNotification('Download started', 'success');
    }

    async loadPhotos() {
        try {
            const response = await fetch('/api/photos');
            if (response.ok) {
                this.photos = await response.json();
                this.applyFiltersAndSort();
                this.updateUI();
            } else {
                throw new Error('Failed to load photos');
            }
        } catch (error) {
            console.error('Error loading photos:', error);
            this.showNotification('Failed to load photos', 'error');
        }
    }

    applyFiltersAndSort() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortBy').value;

        // Filter by category
        this.filteredPhotos = this.photos.filter(photo => {
            if (!categoryFilter) return true;
            return photo.category === categoryFilter;
        });

        // Sort
        switch (sortBy) {
            case 'oldest':
                this.filteredPhotos.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
                break;
            case 'title':
                this.filteredPhotos.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'newest':
            default:
                this.filteredPhotos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        }

        this.updateUI();
    }

    resetFilters() {
        document.getElementById('categoryFilter').value = '';
        document.getElementById('sortBy').value = 'newest';
        this.applyFiltersAndSort();
    }

    startSlideshow() {
        if (this.filteredPhotos.length === 0) {
            this.showNotification('No photos to display in slideshow', 'info');
            return;
        }

        this.currentSlideshowIndex = 0;
        this.slideshowAutoPlay = true;
        this.showSlideshowPhoto();
        document.getElementById('slideshowModal').classList.add('show');
        this.autoPlaySlideshow();
    }

    stopSlideshow() {
        document.getElementById('slideshowModal').classList.remove('show');
        this.slideshowAutoPlay = false;
        clearInterval(this.slideshowInterval);
    }

    nextSlide() {
        this.currentSlideshowIndex = (this.currentSlideshowIndex + 1) % this.filteredPhotos.length;
        this.showSlideshowPhoto();
    }

    prevSlide() {
        this.currentSlideshowIndex = (this.currentSlideshowIndex - 1 + this.filteredPhotos.length) % this.filteredPhotos.length;
        this.showSlideshowPhoto();
    }

    showSlideshowPhoto() {
        this.currentSlideshowPhoto = this.filteredPhotos[this.currentSlideshowIndex];
        document.getElementById('slideshowImg').src = this.currentSlideshowPhoto.url;
        document.getElementById('slideshowTitle').textContent = this.currentSlideshowPhoto.title;
        document.getElementById('slideshowCounter').textContent = 
            `${this.currentSlideshowIndex + 1} / ${this.filteredPhotos.length}`;
    }

    toggleAutoPlay() {
        this.slideshowAutoPlay = !this.slideshowAutoPlay;
        const autoPlayIcon = document.getElementById('autoPlayIcon');
        const autoPlayText = document.getElementById('autoPlayText');

        if (this.slideshowAutoPlay) {
            autoPlayIcon.className = 'fas fa-pause';
            autoPlayText.textContent = 'Auto Playing...';
            this.autoPlaySlideshow();
        } else {
            autoPlayIcon.className = 'fas fa-play';
            autoPlayText.textContent = 'Auto Play';
            clearInterval(this.slideshowInterval);
        }
    }

    autoPlaySlideshow() {
        clearInterval(this.slideshowInterval);
        this.slideshowInterval = setInterval(() => {
            if (this.slideshowAutoPlay) {
                this.nextSlide();
            }
        }, 3000);
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s;
            ${type === 'success' ? 'background: #10b981;' : ''}
            ${type === 'error' ? 'background: #ef4444;' : ''}
            ${type === 'info' ? 'background: #6366f1;' : ''}
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

const dashboard = new PhotoDashboard();

function login() {
    dashboard.openModal('loginModal');
}

function closeModal(modalId) {
    dashboard.closeModal(modalId);
}

function viewPhoto(photoId) {
    dashboard.viewPhoto(photoId);
}

function downloadPhoto(photoId) {
    dashboard.downloadPhoto(photoId);
}

function deletePhoto(photoId) {
    dashboard.deletePhoto(photoId);
}