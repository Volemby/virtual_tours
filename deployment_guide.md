# Virtual Tours Deployment Guide

## Prerequisites
- Docker and Docker Compose installed
- Global Caddy instance running on the `caddy_net` network

## Deployment Steps

1. **Navigate to the project directory:**
   ```bash
   cd /path/to/virtual-tours
   ```

2. **Start the services:**
   ```bash
   docker compose down --remove-orphans
   docker compose up -d --build
   ```

3. **Reload Caddy Configuration:**
   Assuming your global Caddy instance is named `caddy` and mounts the Caddyfile or expects a reload:
   ```bash
   docker exec caddy caddy reload --config /etc/caddy/Caddyfile
   ```
   *Ensure the content of `virtual-tours.caddy` is included in your global Caddyfile.*

## Verification
- Visit `https://virtualtours.cecite.cz` (or your configured domain).
- You should see the Virtual Tours Manager interface.
- Try uploading a tour zip file and a cover photo.
- Verify the tour loads correctly by clicking "View".

## Troubleshooting
- **Frontend not loading:** Check logs `docker logs virtualtours_frontend`.
- **Backend error:** Check logs `docker logs virtualtours_backend`.
- **Caddy 502:** Ensure `virtualtours_frontend` container is running and joined to `caddy_net`.
