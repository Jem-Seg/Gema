/**
 * Configuration PM2 pour GeStock
 * Optimisée pour production Windows avec PostgreSQL
 */

module.exports = {
  apps: [{
    name: 'gestock',
    script: '.next/standalone/server.js',
    cwd: process.cwd(),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Variables d'environnement production
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0', // Écoute sur toutes interfaces réseau
      
      // PostgreSQL (à configurer)
      DATABASE_URL: 'postgresql://user:password@localhost:5432/gestock',
      
      // NextAuth (à configurer avec votre domaine)
      NEXTAUTH_URL: 'http://your-server-ip:3000',
      NEXTAUTH_SECRET: 'your-secret-key-here-generate-with-openssl',
      
      // Logs
      PM2_LOGS: 'true',
    },
    
    // Configuration des logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    
    // Gestion des crashes
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Monitoring
    listen_timeout: 10000,
    kill_timeout: 5000,
  }]
};
