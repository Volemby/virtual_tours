#!/bin/bash

# Virtual Tours Platform Deployment Script
# Run this script to deploy or update the virtual tours platform

set -e

echo "🚀 Virtual Tours Platform Deployment"
echo "===================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (sudo $0)"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo "❌ Docker or Docker Compose is not available. Please install Docker first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Navigate to project directory
cd /root/virtual-tours

echo "📦 Building and starting containers..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo "⏳ Waiting for container to be ready..."
sleep 5

# Check if container is running
if docker ps | grep -q virtual-tours-server; then
    echo "✅ Container is running"
else
    echo "❌ Container failed to start"
    docker compose logs
    exit 1
fi

# Test internal connection
if curl -s http://localhost:8082/ > /dev/null; then
    echo "✅ Internal connection working"
else
    echo "❌ Internal connection failed"
    exit 1
fi

# Check nginx configuration on host
if [ -f /etc/nginx/sites-available/virtual-tours ]; then
    echo "✅ Host nginx configuration exists"
    
    # Test nginx configuration
    if nginx -t 2>/dev/null; then
        echo "✅ Nginx configuration is valid"
        systemctl reload nginx
        echo "✅ Nginx reloaded"
    else
        echo "❌ Nginx configuration has errors"
        nginx -t
    fi
else
    echo "⚠️  Host nginx configuration not found"
    echo "📋 To complete setup, create /etc/nginx/sites-available/virtual-tours"
    echo "    See README.md for configuration details"
fi

# Check SSL certificate
if [ -f /etc/letsencrypt/live/virtual-tours.vystavit.cz/fullchain.pem ]; then
    echo "✅ SSL certificate exists"
    
    # Check certificate expiry
    expiry=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/virtual-tours.vystavit.cz/fullchain.pem | cut -d= -f2)
    echo "📅 SSL certificate expires: $expiry"
else
    echo "⚠️  SSL certificate not found"
    echo "🔒 Run: certbot --nginx -d virtual-tours.vystavit.cz"
fi

echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo "Container Status: $(docker ps --format 'table {{.Names}}\t{{.Status}}' | grep virtual-tours-server || echo 'Not running')"
echo "Internal URL: http://localhost:8082/"
echo "Public URL: https://virtual-tours.vystavit.cz/"
echo "Upload Interface: https://virtual-tours.vystavit.cz/upload.html"
echo ""
echo "📋 Useful Commands:"
echo "View logs: docker compose logs -f"
echo "Restart: docker compose restart"
echo "Stop: docker compose down"
echo ""
echo "✅ Deployment complete! Check README.md for full documentation."
