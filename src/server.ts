import 'reflect-metadata';
import express, { Express, Router } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import config from './Shared/config';
import { registerControllers } from './util/registerControllers';
import './api/index';
import { errorHandler } from './middleware/errorHandler';
import { wrapAsyncRoutes } from './util/wraAsyncRoutes';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

import { swaggerUi, swaggerSpec } from './swagger';
// Import the WebsiteRouter
import WebsiteRouter from './api/websiteRoute';
import { Container } from 'typedi';
import { ReminderScheduler } from './scheduler/ReminderScheduler';

class App {
  private app: Express;
  private router: Router;

  constructor() {
    this.app = express();
    this.router = express.Router();
    this.setMiddleware();
    this.setRoutes();
    this.setErrorHandler();
    this.startApp();
  }

  setMiddleware() {
    this.app.use(cors(config.corsOptions));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    dotenv.config();
    this.app.use(this.router);

    // Swagger UI setup
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  setRoutes() {
    this.app.use('/', this.router);
    registerControllers(this.router);

    wrapAsyncRoutes(this.router);

    // Fallback: Mount WebsiteRouter as the last route handler
    const websiteRouter = new WebsiteRouter();
    websiteRouter.SetRouter(this.router);
  }

  setErrorHandler() {
    this.app.use(errorHandler);
  }

  startApp() {
    // Read port and SSL env vars. If SSL key/cert are provided and readable,
    // start an HTTPS server. Otherwise fall back to HTTP.
    const port = Number(process.env.APP_PORT) || 3001;
    const keyPath = process.env.SSL_KEY_PATH || process.env.SSL_KEY || '';
    const certPath = process.env.SSL_CERT_PATH || process.env.SSL_CERT || '';
    const caPath = process.env.SSL_CA_PATH || '';

    // Keep a reference to the scheduler instance so we can stop it on shutdown
    let schedulerInstance: ReminderScheduler | null = null;
    const startScheduler = () => {
      schedulerInstance = Container.get(ReminderScheduler);
      schedulerInstance.start();
    };

    const startHttp = () => {
      const server = http.createServer(this.app);
      server.listen(port, () => {
        console.log(`Project running (HTTP) on ${port}`);
        startScheduler();
      });
    };

    // Try to start HTTPS if key and cert are present. If they exist,
    // start an HTTPS server on `port` and also start an HTTP server that
    // redirects all requests to HTTPS (useful for automatic redirect).
    if (keyPath && certPath) {
      try {
        const resolvedKey = path.resolve(keyPath);
        const resolvedCert = path.resolve(certPath);

        if (fs.existsSync(resolvedKey) && fs.existsSync(resolvedCert)) {
          const privateKey = fs.readFileSync(resolvedKey, 'utf8');
          const certificate = fs.readFileSync(resolvedCert, 'utf8');
          const credentials: any = { key: privateKey, cert: certificate };
          if (caPath) {
            const resolvedCa = path.resolve(caPath);
            if (fs.existsSync(resolvedCa)) {
              credentials.ca = fs.readFileSync(resolvedCa, 'utf8');
            }
          }

          // Determine HTTP port to listen on for redirects. Prefer explicit env var,
          // otherwise choose a sensible default (if APP_PORT is 3001 default HTTP -> 3000,
          // otherwise use APP_PORT - 1).
          const httpPort =
            Number(process.env.APP_HTTP_PORT) ||
            (port === 3001 ? 3000 : Math.max(1, port - 1));

          const httpsServer = https.createServer(credentials, this.app);
          httpsServer.listen(port, () => {
            console.log(`Project running (HTTPS) on ${port}`);
            startScheduler();
            console.log(
              `HTTP->HTTPS redirect server will listen on ${httpPort}`
            );
          });

          // Simple redirect server: redirect all requests to the same host with https and target port
          const redirectServer = http.createServer((req, res) => {
            try {
              const host = req.headers.host
                ? String(req.headers.host).split(':')[0]
                : 'localhost';
              const target = `https://${host}:${port}${req.url || '/'}`;
              // Use 301 permanent redirect for browsers
              res.writeHead(301, { Location: target });
              res.end();
            } catch (redirErr) {
              // Fallback: simple text response
              res.writeHead(302, { Location: `https://localhost:${port}` });
              res.end();
            }
          });

          redirectServer.listen(httpPort, () => {
            console.log(
              `Redirecting HTTP requests on ${httpPort} to HTTPS ${port}`
            );
          });

          return;
        } else {
          console.warn(
            'SSL key or certificate file not found at provided paths. Falling back to HTTP.'
          );
        }
      } catch (err) {
        const e: any = err;
        console.warn(
          'Failed to start HTTPS server, falling back to HTTP. Error:',
          e?.message || e
        );
      }
    }

    // Default: start plain HTTP
    startHttp();

    // Graceful shutdown and crash handlers. These will stop the scheduler (if started)
    // and exit so an external process manager (pm2, systemd, Docker, etc.) can restart.
    const shutdown = async (signal?: string) => {
      try {
        console.log(`Received ${signal || 'shutdown'}, stopping server...`);
        if (schedulerInstance && typeof schedulerInstance.stop === 'function') {
          try {
            schedulerInstance.stop();
          } catch (stopErr) {
            console.warn('Error stopping scheduler:', stopErr);
          }
        }
      } finally {
        // Give some time for cleanup then exit
        setTimeout(() => process.exit(signal ? 0 : 1), 100);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      // allow process manager to restart the process
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      // allow process manager to restart the process
      shutdown('unhandledRejection');
    });
  }
}

new App();
