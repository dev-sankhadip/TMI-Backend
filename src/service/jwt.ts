import jwt from 'jsonwebtoken';
import config from '../Shared/config';

export function generateAccessToken(payload: object) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });
}

export function generateRefreshToken(payload: object) {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '45d' });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.jwtSecret);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, config.jwtRefreshSecret);
}
