# Virtual Tours Platform

A complete self-hosted virtual tours platform with SSL support, cover photo management, and Docker containerization.

## 🎯 Overview

This system provides a robust platform for hosting virtual tour content with the following capabilities:
- **Secure HTTPS hosting** via nginx reverse proxy with Let's Encrypt SSL
- **Cover photo upload system** with PHP backend
- **Tour management** via JSON API
- **Docker containerization** for easy deployment
- **Production-ready** configuration for virtual-tours.vystavit.cz

## 🏗️ Architecture

```
Internet → nginx (Host) → Docker Container (nginx+PHP) → Content
    ↓              ↓                    ↓
  HTTPS        SSL Termination      Tours + API
  Port 443     Reverse Proxy        Port 8082
```

### Components:
1. **Host nginx** - SSL termination and reverse proxy
2. **Docker Container** - Custom nginx+PHP83 Alpine image
3. **Content Storage** - Virtual tours and cover photos
4. **PHP APIs** - Upload handling and tour listing

## 📁 Project Structure

```
virtual-tours/
├── README.md                 # This documentation
├── docker-compose.yml        # Container orchestration
├── Dockerfile               # Custom nginx+PHP image
├── index.html               # Main tour listing page
├── upload.html              # Cover photo upload interface
├── favicon.svg              # Site icon
├── upload-cover.php         # PHP upload backend
├── api-tours.php           # Tour listing API
├── config/
│   └── nginx.conf          # Container nginx configuration
├── tours/                  # Virtual tour content (mounted)
│   └── [tourName]/
│       ├── index.htm       # Tour entry point
│       ├── thumbnail.png   # Tour thumbnail
│       └── media/          # Tour assets
├── covers/                 # Cover photos (mounted)
│   └── [tourId].{png,jpg}  # Cover images
└── ssl/                    # SSL certificates (if local)
```

## 🚀 Quick Start

### Prerequisites
- Ubuntu/Debian server with root access
- Docker and Docker Compose installed
- Domain pointing to your server IP

### 1. Deploy the Container
```bash
cd /root/virtual-tours
docker-compose up -d --build
```

### 2. Configure Host nginx (if not done)
```bash
# Install nginx on host
apt update && apt install nginx certbot python3-certbot-nginx

# Create site configuration
cat > /etc/nginx/sites-available/virtual-tours << 'EOF'
server {
    listen 80;
    server_name virtual-tours.vystavit.cz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name virtual-tours.vystavit.cz;

    ssl_certificate /etc/letsencrypt/live/virtual-tours.vystavit.cz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/virtual-tours.vystavit.cz/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/virtual-tours /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get SSL certificate
certbot --nginx -d virtual-tours.vystavit.cz
```

### 3. Add Tour Content
```bash
# Add a new virtual tour
mkdir -p /root/virtual-tours/tours/myTour
# Copy your tour files to /root/virtual-tours/tours/myTour/
# Ensure index.htm exists as the main tour file
```

## 📡 API Endpoints

### Tour Listing API
```
GET /api-tours.php
Returns: JSON array of available tours
```

**Response Format:**
```json
[
  {
    "id": "doradoKinskyVirtualTour",
    "name": "Dorado Kinsky Virtual Tour",
    "url": "/tours/doradoKinskyVirtualTour/",
    "thumbnail": "/tours/doradoKinskyVirtualTour/thumbnail.png",
    "coverPhoto": "/covers/doradoKinskyVirtualTour.png"
  }
]
```

### Cover Photo Upload API
```
POST /upload-cover.php
Content-Type: multipart/form-data

Parameters:
- tourId: string (required) - Unique tour identifier
- cover: file (required) - Image file (JPEG, PNG, GIF, WebP, max 10MB)
```

**Success Response:**
```json
{
  "success": true,
  "url": "https://virtual-tours.vystavit.cz/covers/tourId.png",
  "filename": "tourId.png",
  "tourId": "tourId",
  "size": 124558
}
```

## 🔧 Configuration

### Docker Container Settings
- **Port**: 8082 (internal: 80)
- **PHP Version**: 8.3 (Alpine)
- **Max Upload Size**: 10MB
- **Restart Policy**: unless-stopped

### Security Features
- SSL/TLS encryption via Let's Encrypt
- File type validation (images only)
- Size limits on uploads
- Input sanitization
- CORS headers configured
- Security headers (CSP, XSS protection)

### Directory Permissions
- `tours/`: Read-only for container
- `covers/`: Read-write for container (PHP uploads)
- Container runs as nginx user with proper file permissions

## 🎮 Usage

### Adding a New Virtual Tour
1. Create directory: `/root/virtual-tours/tours/[tourName]/`
2. Copy tour files (ensure `index.htm` exists)
3. Add thumbnail.png for listing page
4. Tour automatically appears in the main listing

### Uploading Cover Photos
1. Visit: `https://virtual-tours.vystavit.cz/upload.html`
2. Enter Tour ID (must match tour directory name)
3. Select image file
4. Upload and get public URL for iframe embedding

### Accessing Tours
- **Main Page**: `https://virtual-tours.vystavit.cz/`
- **Specific Tour**: `https://virtual-tours.vystavit.cz/tours/[tourName]/`
- **Upload Interface**: `https://virtual-tours.vystavit.cz/upload.html`
- **Cover Photo**: `https://virtual-tours.vystavit.cz/covers/[tourId].ext`

## 🔄 Maintenance

### Container Management
```bash
# View logs
docker-compose logs -f

# Restart container
docker-compose restart

# Rebuild after changes
docker-compose down
docker-compose up -d --build

# Update SSL certificates (auto-renews)
certbot renew --nginx
```

### File Management
```bash
# Check disk usage
du -sh /root/virtual-tours/tours/
du -sh /root/virtual-tours/covers/

# Backup tours
tar -czf tours-backup-$(date +%Y%m%d).tar.gz /root/virtual-tours/tours/

# Clean old covers
find /root/virtual-tours/covers/ -type f -mtime +30 -delete
```

## 🛡️ Security Considerations

1. **SSL Certificate**: Auto-renewal configured with certbot
2. **File Uploads**: Restricted to images, size-limited, type-validated
3. **Directory Access**: Proper container permissions prevent unauthorized access
4. **Reverse Proxy**: Host nginx provides additional security layer
5. **Container Isolation**: Docker provides process and filesystem isolation

## 🐛 Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker-compose logs
# Check for port conflicts or permission issues
```

**Upload fails:**
```bash
# Check PHP logs
docker exec virtual-tours-server tail -f /var/log/php83-fpm.log

# Check directory permissions
ls -la /root/virtual-tours/covers/
```

**SSL certificate issues:**
```bash
# Check certificate status
certbot certificates

# Manual renewal
certbot renew --nginx --dry-run
```

**Tour not appearing:**
```bash
# Verify directory structure
ls -la /root/virtual-tours/tours/[tourName]/
# Ensure index.htm exists
```

## 📊 Performance

- **Static File Serving**: nginx handles tour content efficiently
- **PHP-FPM**: Optimized for upload handling
- **Caching**: Browser caching headers set for media files
- **Compression**: gzip enabled for text content
- **Resource Limits**: 10MB max upload, reasonable PHP limits

## 🔗 Integration

### Iframe Embedding
```html
<!-- Embed a tour -->
<iframe src="https://virtual-tours.vystavit.cz/tours/tourName/" 
        width="800" height="600" frameborder="0"></iframe>

<!-- Embed cover photo -->
<img src="https://virtual-tours.vystavit.cz/covers/tourId.png" 
     alt="Tour Cover">
```

### API Integration
```javascript
// Fetch available tours
fetch('https://virtual-tours.vystavit.cz/api-tours.php')
  .then(response => response.json())
  .then(tours => {
    tours.forEach(tour => {
      console.log(`Tour: ${tour.name} - ${tour.url}`);
    });
  });
```

---

## 🎉 System Status: Production Ready

Your virtual tours platform is fully operational with:
- ✅ HTTPS SSL encryption
- ✅ Docker containerization  
- ✅ Cover photo upload system
- ✅ Tour listing API
- ✅ Production domain configuration
- ✅ Automated certificate renewal
- ✅ Security hardening
- ✅ Error handling and logging

**Live URLs:**
- Main Platform: https://virtual-tours.vystavit.cz/
- Upload Interface: https://virtual-tours.vystavit.cz/upload.html
- Example Tour: https://virtual-tours.vystavit.cz/tours/doradoKinskyVirtualTour/
