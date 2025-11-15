import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import * as zlib from 'zlib';
import { Controller } from '../decorator/controller';

@Controller('')
export default class WebsiteRouter {
  constructor() {}

  SetRouter(router: Router) {
    router.get('/*', (req: Request, res: Response): void => {
      // Get the requested path (it captures nested folders)
      // req.params['0'] is provided by the wildcard route
      let requestedPath = req.params['0'] || req.path;

      // If the path is empty or '/', default to index.html
      if (requestedPath === '/' || requestedPath === '') {
        requestedPath = 'index.html';
      }

      // Absolute path to the website folder
      const websiteFolderPath = '/home/ec2-user/TMI-Backend/src' + '/website';
      // Construct the full file path
      const filePath = path.join(websiteFolderPath, requestedPath);

      // Prevent directory traversal by ensuring the file is within the website folder
      if (!filePath.startsWith(websiteFolderPath)) {
        res.status(403).send({ message: 'Access denied.' });
        return;
      }

      // Check if the file exists and send it
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          return res.status(404).send({ message: 'File not found.' });
        }

        // If client accepts gzip and file is larger than threshold, prefer compressed responses
        const acceptEncoding = String(req.headers['accept-encoding'] || '');
        const supportsGzip = /\bgzip\b/.test(acceptEncoding);
        const GZIP_THRESHOLD = 1 * 1024 * 1024; // 1 MB

        // Helper to set content type based on original file extension
        const setContentType = () => {
          // express res.type accepts an extension like '.html' or 'html'
          res.type(path.extname(filePath) || 'application/octet-stream');
        };

        if (supportsGzip && stats.size > GZIP_THRESHOLD) {
          const gzPath = filePath + '.gz';
          res.setHeader('Vary', 'Accept-Encoding');

          // If a pre-compressed .gz exists, serve it directly with Content-Encoding
          if (fs.existsSync(gzPath)) {
            res.setHeader('Content-Encoding', 'gzip');
            setContentType();
            return res.sendFile(gzPath, (sendErr) => {
              if (sendErr) {
                res.status(404).send({ message: 'File not found.' });
              }
            });
          }

          // Otherwise stream the file through gzip on-the-fly
          res.setHeader('Content-Encoding', 'gzip');
          setContentType();

          const readStream = fs.createReadStream(filePath);
          const gzip = zlib.createGzip();
          readStream.on('error', () => {
            return res.status(404).send({ message: 'File not found.' });
          });
          // Pipe compressed stream to response
          return readStream.pipe(gzip).pipe(res);
        }

        // Default: send file as-is
        res.sendFile(filePath, (sendErr) => {
          if (sendErr) {
            res.status(404).send({ message: 'File not found.' });
          }
        });
      });
    });
  }
}
