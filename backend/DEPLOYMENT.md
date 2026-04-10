# VibeFinance Backend Deployment Guide

## Overview
This backend serves as a Backend for Frontend (BFF) for VibeFinance, providing API endpoints that connect to Supabase and add business logic.

## Current Deployment Status
- **Frontend**: `https://freelukefinance.quantanova.net`
- **Backend**: `https://bfffreelukefinance.quantanova.net`
- **Local Development**: `http://localhost:19112`
- **Supabase**: Local development instance running via Docker

## Production Deployment

### 1. Environment Configuration
Create a `.env` file in the backend directory with the following variables:

```bash
# Server Configuration
PORT=19112
NODE_ENV=production

# Supabase Configuration (Production)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Frontend URL
FRONTEND_URL=https://freelukefinance.quantanova.net

# Backend URL
BACKEND_URL=https://bfffreelukefinance.quantanova.net

# JWT Secret (generate a strong secret)
JWT_SECRET=generate-a-strong-random-secret-here

# API Keys (for external services)
POLYGON_API_KEY=your_real_polygon_api_key
ALPHA_VANTAGE_API_KEY=your_real_alphavantage_api_key
NEWS_API_KEY=your_real_newsapi_key
FINNHUB_API_KEY=your_real_finnhub_key
MASSIVE_API_KEY=your_real_massive_api_key

# Database Connection Pool
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_IDLE=10000
DB_POOL_ACQUIRE=30000
```

### 2. Setting Up Supabase Production
1. Create a Supabase project at https://supabase.com
2. Get your project URL and API keys from Project Settings > API
3. Run the database migrations from `vibefinance/supabase/migrations/20250409202600_initial_schema.sql` in the Supabase SQL Editor
4. Update the environment variables with your production Supabase credentials

### 3. Deployment Options

#### Option A: PM2 (Recommended for Linux servers)
```bash
# Install PM2 globally
npm install -g pm2

# Start the backend with PM2
pm2 start src/index.js --name "vibefinance-backend"

# Save PM2 process list
pm2 save

# Set up PM2 to start on boot
pm2 startup

# Monitor logs
pm2 logs vibefinance-backend
```

#### Option B: Docker
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 19112
CMD ["node", "src/index.js"]
```

Build and run:
```bash
docker build -t vibefinance-backend .
docker run -d -p 19112:19112 --name vibefinance-backend --env-file .env vibefinance-backend
```

#### Option C: Systemd Service (Linux)
Create `/etc/systemd/system/vibefinance-backend.service`:
```ini
[Unit]
Description=VibeFinance Backend
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/path/to/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable vibefinance-backend
sudo systemctl start vibefinance-backend
```

### 4. Nginx Configuration (if needed)
If using nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name bfffreelukefinance.quantanova.net;
    
    location / {
        proxy_pass http://localhost:19112;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SSL configuration (if using HTTPS)
    listen 443 ssl;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
}
```

### 5. SSL Certificate (Let's Encrypt)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d bfffreelukefinance.quantanova.net
```

## Monitoring and Maintenance

### Health Checks
- `GET /health` - Basic health check
- `GET /api/auth/test` - Supabase connection test

### Logs
- Application logs are written to stdout/stderr
- Use PM2 logs or systemd journal for monitoring:
  ```bash
  pm2 logs vibefinance-backend
  # or
  journalctl -u vibefinance-backend -f
  ```

### Performance Monitoring
- Consider adding New Relic, Datadog, or similar APM tools
- Monitor memory usage and response times

## Database Migrations
When updating the database schema:

1. Create a new migration file in `vibefinance/supabase/migrations/`
2. Apply to local Supabase: `supabase db reset`
3. Apply to production via Supabase Dashboard SQL Editor

## Troubleshooting

### Common Issues

1. **Port already in use**: Change PORT in .env or kill existing process
2. **Supabase connection failed**: Verify credentials and network connectivity
3. **CORS errors**: Ensure FRONTEND_URL is correctly set in .env
4. **Memory leaks**: Monitor with `pm2 monit` or similar tools

### Debug Mode
For debugging, set `NODE_ENV=development` to get more detailed error messages.

## Backup and Recovery

### Database Backups
- Use Supabase dashboard for automated backups
- Manual backup: `pg_dump` from Supabase connection string

### Application Backups
- Keep code in version control (Git)
- Backup environment variables securely
- Consider using a secrets manager (AWS Secrets Manager, HashiCorp Vault)

## Scaling Considerations

1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Database Connection Pooling**: Adjust DB_POOL_* settings based on load
3. **Caching**: Implement Redis for frequently accessed data
4. **CDN**: Use CloudFront or similar for static assets

## Security Checklist
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Set up firewall rules
- [ ] Regular dependency updates
- [ ] Security headers via Helmet (already configured)
- [ ] Rate limiting (consider adding express-rate-limit)
- [ ] Input validation on all endpoints

## Support
For issues, check:
1. Application logs
2. Supabase dashboard for database issues
3. Network connectivity between services