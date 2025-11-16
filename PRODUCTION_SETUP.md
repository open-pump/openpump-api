# OpenPump API - Production Setup Guide

Complete guide for deploying OpenPump API to production.

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- Redis 7+
- Solana RPC endpoint (Helius recommended)
- Domain name with SSL certificate

---

## 1. Server Setup

### Recommended Specs

**Minimum:**
- 2 vCPU
- 4GB RAM
- 20GB SSD storage
- Ubuntu 22.04 LTS

**Recommended:**
- 4 vCPU
- 8GB RAM
- 50GB SSD storage
- Ubuntu 22.04 LTS

**Providers:**
- DigitalOcean ($48/mo for 4GB Droplet)
- AWS EC2 t3.medium ($30-50/mo)
- Hetzner Cloud CPX21 (~€10/mo)

---

## 2. Install Dependencies

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should be v20.x.x
```

### Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Redis
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

---

## 3. PostgreSQL Setup

### Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE openpump;
CREATE USER openpump_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE openpump TO openpump_user;
\q
```

### Configure PostgreSQL for Remote Access (Optional)
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Change:
listen_addresses = 'localhost'  # or '*' for all interfaces

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add:
host    openpump    openpump_user    0.0.0.0/0    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 4. Redis Setup

### Configure Redis
```bash
sudo nano /etc/redis/redis.conf
```

**Recommended settings:**
```conf
# Bind to localhost only (unless you need remote access)
bind 127.0.0.1

# Set max memory (adjust based on your RAM)
maxmemory 1gb
maxmemory-policy allkeys-lru

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Require password (generate secure password)
requirepass your_redis_password
```

**Restart Redis:**
```bash
sudo systemctl restart redis-server
```

---

## 5. Application Setup

### Clone Repository
```bash
cd /opt
sudo mkdir openpump-api
sudo chown $USER:$USER openpump-api
cd openpump-api

# Clone your repo
git clone https://github.com/yourusername/openpump-api.git .
```

### Install Dependencies
```bash
npm install
```

### Build TypeScript
```bash
npm run build
```

---

## 6. Environment Configuration

### Create Production .env
```bash
nano .env
```

**Production .env file:**
```bash
# Environment
NODE_ENV=production
PORT=3000

# API Settings
API_TITLE="OpenPump API"
API_VERSION="1.0.0"
API_DESCRIPTION="Open-source pump.fun intelligence API"
CORS_ORIGIN=https://yourdomain.com

# Solana RPC (Helius recommended)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY

# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=openpump
DATABASE_USER=openpump_user
DATABASE_PASSWORD=your_secure_password
DATABASE_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Cache TTLs (seconds)
CACHE_TTL_METADATA=300      # 5 minutes
CACHE_TTL_BONDING_CURVE=10  # 10 seconds
CACHE_TTL_PRICE=30          # 30 seconds

# Test Mode (DISABLE IN PRODUCTION!)
TEST_MODE=false

# Rate Limiting
RATE_LIMIT_WINDOW=60        # 1 minute
```

**Secure the file:**
```bash
chmod 600 .env
```

---

## 7. Database Migrations

### Run Schema Creation
```bash
# From project root
PGPASSWORD=your_secure_password psql -h localhost -U openpump_user -d openpump -f config/schema.sql
```

### Verify Tables Created
```bash
PGPASSWORD=your_secure_password psql -h localhost -U openpump_user -d openpump -c "\dt"
```

**Expected tables:**
- users
- api_keys
- api_usage
- tokens
- token_social_links
- price_snapshots
- token_pairs

---

## 8. Create Initial API Keys

### Insert API Keys
```bash
PGPASSWORD=your_secure_password psql -h localhost -U openpump_user -d openpump
```

```sql
-- Create admin user
INSERT INTO users (email, tier)
VALUES ('admin@yourdomain.com', 'elite')
RETURNING id;

-- Create API key (use the user_id from above)
INSERT INTO api_keys (key, user_id, tier, rate_limit_per_minute, rate_limit_per_day, active)
VALUES (
  'sk_live_your_32_char_random_string_here',  -- Generate securely!
  1,  -- user_id from above
  'elite',
  1000,
  1000000,
  true
) RETURNING *;
```

**Generate secure API key:**
```bash
node -e "console.log('sk_live_' + require('crypto').randomBytes(32).toString('hex'))"
```

---

## 9. PM2 Process Management

### Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'openpump-api',
    script: 'dist/index.js',
    instances: 2,  // Use CPU cores - 1
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10
  }]
};
```

### Start Application
```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions printed
```

### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs openpump-api

# Restart
pm2 restart openpump-api

# Stop
pm2 stop openpump-api

# Delete
pm2 delete openpump-api
```

---

## 10. Nginx Reverse Proxy

### Install Nginx
```bash
sudo apt install -y nginx
```

### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/openpump-api
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (use certbot for Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate limiting (optional - API has built-in rate limiting)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_req zone=api_limit burst=200 nodelay;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript;

    # Access logs
    access_log /var/log/nginx/openpump-api.access.log;
    error_log /var/log/nginx/openpump-api.error.log;
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/openpump-api /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## 11. SSL Certificate (Let's Encrypt)

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain Certificate
```bash
sudo certbot --nginx -d api.yourdomain.com
```

### Auto-renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot will auto-renew via systemd timer
sudo systemctl status certbot.timer
```

---

## 12. Firewall Setup

### Configure UFW
```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 13. Monitoring

### Setup PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Health Check Endpoint
Test health endpoint:
```bash
curl https://api.yourdomain.com/health
```

### Setup Uptime Monitoring
Use services like:
- **UptimeRobot** (free for basic monitoring)
- **Pingdom**
- **Datadog**
- **New Relic**

---

## 14. Performance Optimization

### PostgreSQL Tuning
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

**Recommended settings (adjust for your RAM):**
```conf
# For 8GB RAM server
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 32MB
max_connections = 100
```

### Redis Optimization
Already configured maxmemory and eviction policy in step 4.

### Application Performance
- Enable Redis caching (done via .env)
- Use PM2 cluster mode (2-4 instances)
- Monitor response times via logs

---

## 15. Backup Strategy

### Database Backups
```bash
# Create backup script
nano /opt/openpump-api/scripts/backup-db.sh
```

**backup-db.sh:**
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/openpump"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="openpump_$DATE.sql.gz"

mkdir -p $BACKUP_DIR
PGPASSWORD=your_secure_password pg_dump -h localhost -U openpump_user openpump | gzip > "$BACKUP_DIR/$FILENAME"

# Keep only last 30 days
find $BACKUP_DIR -name "openpump_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME"
```

```bash
chmod +x /opt/openpump-api/scripts/backup-db.sh
```

### Setup Cron
```bash
crontab -e

# Add:
0 2 * * * /opt/openpump-api/scripts/backup-db.sh
```

---

## 16. Security Checklist

- [ ] PostgreSQL uses strong password
- [ ] Redis requires authentication
- [ ] `.env` file has 600 permissions
- [ ] API keys are randomly generated (32+ chars)
- [ ] SSL certificate is valid
- [ ] Firewall is enabled (UFW)
- [ ] `TEST_MODE=false` in production
- [ ] Rate limiting is enabled
- [ ] Nginx security headers are set
- [ ] Regular backups are scheduled
- [ ] Server has automatic security updates

---

## 17. Testing Production

### Basic Tests
```bash
# Health check
curl https://api.yourdomain.com/health

# Test with API key
curl -H "Authorization: Bearer sk_live_your_key" \
  https://api.yourdomain.com/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump
```

### Load Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test 1000 requests, 10 concurrent
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_KEY" \
  https://api.yourdomain.com/health
```

---

## 18. Maintenance

### Update Application
```bash
cd /opt/openpump-api
git pull
npm install
npm run build
pm2 restart openpump-api
```

### View Logs
```bash
# Application logs
pm2 logs openpump-api

# Nginx logs
sudo tail -f /var/log/nginx/openpump-api.access.log
sudo tail -f /var/log/nginx/openpump-api.error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Database Maintenance
```bash
# Vacuum database (monthly)
PGPASSWORD=your_password psql -h localhost -U openpump_user -d openpump -c "VACUUM ANALYZE;"

# Check database size
PGPASSWORD=your_password psql -h localhost -U openpump_user -d openpump -c "SELECT pg_size_pretty(pg_database_size('openpump'));"
```

---

## 19. Monitoring Dashboard (Optional)

### Setup Grafana + Prometheus
```bash
# Install Prometheus
# ... (detailed setup)

# Install Grafana
# ... (detailed setup)

# Configure PM2 metrics exporter
pm2 install pm2-prometheus-exporter
```

---

## 20. Cost Estimation

### Monthly Costs

**Server (DigitalOcean 8GB):** $48
**Domain name:** $12/year = $1/mo
**SSL certificate:** Free (Let's Encrypt)
**Helius RPC (Paid):** $99-299/mo

**Total:** $148-348/mo

### Revenue Calculation

**With 100 paid customers:**
- 20 Starter ($49): $980
- 60 Pro ($149): $8,940
- 20 Elite ($249): $4,980
- **Total:** $14,900/mo

**Profit:** $14,900 - $348 = $14,552/mo 💰

---

## Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs openpump-api --lines 100

# Check .env file
cat .env

# Test database connection
PGPASSWORD=your_password psql -h localhost -U openpump_user -d openpump -c "SELECT 1;"
```

### High memory usage
```bash
# Check PM2 status
pm2 status

# Restart if needed
pm2 restart openpump-api

# Check Redis memory
redis-cli INFO memory
```

### Slow responses
```bash
# Check PostgreSQL connections
PGPASSWORD=your_password psql -h localhost -U openpump_user -d openpump -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis stats
redis-cli INFO stats

# Monitor RPC usage
# Check Helius dashboard
```

---

## Support

- **Documentation:** https://github.com/yourusername/openpump-api
- **Issues:** https://github.com/yourusername/openpump-api/issues
- **Discord:** [Your Discord]

---

**Ready for Production! 🚀**
