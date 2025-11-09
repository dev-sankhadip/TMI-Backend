import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
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
        res.sendFile(filePath, (err) => {
          if (err) {
            res.status(404).send({ message: 'File not found.' });
          }
        });
      });
    });
  }
}
