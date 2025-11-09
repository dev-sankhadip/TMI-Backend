import bcrypt from 'bcryptjs';

export class UserUtils {
  static generateOTP(): string {
    // Generates a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
