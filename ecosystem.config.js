module.exports = {
  apps: [
    {
      name: 'tmi-server',
      // For production run the compiled build/server.js. For development you may
      // run with `npm run dev` or change script to src/server.ts with ts-node.
      script: 'build/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        APP_PORT: 443,
        APP_HTTP_PORT: 80,
        // Set absolute paths to your certificate files or populate via process manager
        SSL_KEY_PATH: '/etc/letsencrypt/live/timaapp.com/privkey.pem',
        SSL_CERT_PATH: '/etc/letsencrypt/live/timaapp.com/fullchain.pem',
      },
    },
  ],
};
