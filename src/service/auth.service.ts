import { UserUtils } from '../lib/userUtils';
import { MailService } from '../lib/mailService';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from './jwt';

import { Service } from 'typedi';
import { Request, Response } from 'express';
import { GenerateUUID } from '../lib/commonFunctions';
import AuthDatabaseAccessLayer from '../DatabaseAccessLayer/auth.dal';
import { CreateUserType } from '../schema/CreateUser';

@Service()
export default class AuthService {
  constructor(
    private readonly authDA: AuthDatabaseAccessLayer,
    private readonly mailService: MailService
  ) {}

  // In-memory OTP store (email -> { otp, expiresAt })
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  // In-memory store for forgot password OTPs
  private forgotPasswordStore = new Map<
    string,
    { otp: string; expiresAt: number }
  >();

  // POST: Create a new user using OTP verification.
  // If no OTP is provided, an OTP is generated and emailed.
  // If an OTP is provided, it is verified before user creation.
  CreateUser = async (
    request: Request<any, any, CreateUserType>,
    response: Response
  ) => {
    const { firstName, lastName, email, password, otp } = request.body;

    // Step 1: If no OTP is provided, send one.
    if (!otp) {
      const emailExists = await this.authDA.CheckEmailExists(email);
      if (emailExists != null && emailExists.length > 0) {
        response.status(400).send([{ message: 'Email already exists.' }]);
        return;
      }
      const generatedOtp = UserUtils.generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000; // valid for 5 minutes
      this.otpStore.set(email, { otp: generatedOtp, expiresAt });
      try {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 8px #f0f1f2; padding: 24px;">
            <h2 style="color: #2d7ff9; text-align: center;">TIMA - Email Verification</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">Your One-Time Password (OTP) for TIMA registration is:</p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="display: inline-block; font-size: 32px; letter-spacing: 8px; color: #2d7ff9; font-weight: bold; background: #f5f7fa; padding: 12px 32px; border-radius: 6px; border: 1px dashed #2d7ff9;">${generatedOtp}</span>
            </div>
            <p style="font-size: 14px; color: #666;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
            <p style="font-size: 14px; color: #aaa; text-align: center; margin-top: 32px;">&copy; ${new Date().getFullYear()} TIMA</p>
          </div>
        `;
        await this.mailService.sendMail({
          to: email,
          subject: 'TIMA - Your OTP Code',
          text: `Your OTP code is ${generatedOtp}`,
          html,
        });
        response.status(200).send({ message: 'OTP sent to your email.' });
      } catch (error) {
        console.error('Failed to send OTP email:', error);
        response.status(500).send([{ message: 'Failed to send OTP email.' }]);
      }
      return;
    }

    // Step 2: OTP is provided so verify it.
    const stored = this.otpStore.get(email);
    if (!stored) {
      response
        .status(400)
        .send([{ message: 'No OTP request found for this email.' }]);
      return;
    }
    if (stored.expiresAt < Date.now() || stored.otp !== otp) {
      response.status(400).send([{ message: 'Invalid or expired OTP.' }]);
      return;
    }
    // OTP is valid, remove it from storage and create user.
    this.otpStore.delete(email);
    // Hash password before saving
    const hashedPassword = await UserUtils.hashPassword(password!);
    const newUserId = GenerateUUID();
    await this.authDA.CreateUser(
      newUserId,
      firstName,
      lastName,
      email,
      hashedPassword
    );
    // Generate tokens after user creation
    const payload = { userId: newUserId, email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    response.status(200).send({ userId: newUserId, accessToken, refreshToken });
  };

  // GET: Get user details by user id (expects userId as route parameter)
  GetUserById = async (request: Request, response: Response) => {
    const userId = request.userid;
    if (!userId) {
      response.status(400).send([{ message: 'UserId parameter is required.' }]);
      return;
    }
    const user = await this.authDA.GetUserById(userId);
    if (!user || user.length === 0) {
      response.status(404).send([{ message: 'User not found.' }]);
      return;
    }
    response.status(200).send(user[0]);
  };

  // PUT: Update user details after verifying the email exists.
  UpdateUser = async (request: Request, response: Response) => {
    const { firstName, lastName } = request.body;
    const userId = request.userid;
    const userExists = await this.authDA.GetUserById(userId);

    if (!userExists || userExists.length === 0) {
      response.status(404).send([{ message: 'User not found.' }]);
      return;
    }

    await this.authDA.UpdateUser(userId, firstName, lastName);
    response.status(200).send({ message: 'User updated successfully.' });
  };

  // POST: Login user and return JWT tokens
  Login = async (request: Request, response: Response) => {
    const { email, password } = request.body;
    const user = await this.authDA.GetUserByEmail(email);
    if (!user || user.length === 0) {
      response.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // user[0] should have a Password field (hashed)
    const hashedPassword = user[0].Password;
    if (!hashedPassword || !password) {
      response.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const isMatch = await UserUtils.comparePassword(password, hashedPassword);
    if (!isMatch) {
      response.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const payload = { userId: user[0].User_Id, email: user[0].Email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    response.status(200).json({
      userId: user[0].User_Id,
      email: user[0].Email,
      accessToken,
      refreshToken,
    });
    return;
  };

  // POST: Refresh JWT access token
  RefreshToken = async (request: Request, response: Response) => {
    const { refreshToken } = request.body;
    if (!refreshToken) {
      response.status(400).json({ message: 'Refresh token required' });
      return;
    }
    try {
      const decoded = verifyRefreshToken(refreshToken) as any;
      const payload = { userId: decoded.userId, email: decoded.email };
      const accessToken = generateAccessToken(payload);
      response.status(200).json({
        userId: decoded.userId,
        email: decoded.email,
        accessToken,
      });
      return;
    } catch (err) {
      response
        .status(401)
        .json({ message: 'Invalid or expired refresh token' });
      return;
    }
  };

  // POST: Forgot Password - send OTP to email if user exists
  ForgotPassword = async (request: Request, response: Response) => {
    const { email } = request.body;
    if (!email) {
      response.status(400).json({ message: 'Email is required' });
      return;
    }
    const user = await this.authDA.GetUserByEmail(email);
    if (!user || user.length === 0) {
      response.status(404).json({ message: 'User not found' });
      return;
    }
    const otp = UserUtils.generateOTP();
    this.forgotPasswordStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 8px #f0f1f2; padding: 24px;">
          <h2 style="color: #2d7ff9; text-align: center;">TIMA - Password Reset</h2>
          <p style="font-size: 16px; color: #333;">You requested a password reset. Use the OTP below to reset your password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; letter-spacing: 8px; color: #2d7ff9; font-weight: bold; background: #f5f7fa; padding: 12px 32px; border-radius: 6px; border: 1px dashed #2d7ff9;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #666;">This OTP is valid for 5 minutes.</p>
          <p style="font-size: 14px; color: #aaa; text-align: center; margin-top: 32px;">&copy; ${new Date().getFullYear()} TIMA</p>
        </div>
      `;
      await this.mailService.sendMail({
        to: email,
        subject: 'TIMA - Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}`,
        html,
      });
      response.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
      console.error('Failed to send password reset OTP email:', error);
      response
        .status(500)
        .json({ message: 'Failed to send password reset OTP email' });
    }
  };

  // POST: Reset Password - verify OTP and update password
  ResetPassword = async (request: Request, response: Response) => {
    const { email, otp, password } = request.body;
    if (!email || !otp || !password) {
      response
        .status(400)
        .json({ message: 'Email, OTP, and new password are required' });
      return;
    }
    const record = this.forgotPasswordStore.get(email);
    if (!record) {
      response
        .status(400)
        .json({ message: 'No OTP request found for this email' });
      return;
    }
    if (record.expiresAt < Date.now() || record.otp !== otp) {
      response.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }
    // Hash the new password and update it in the DB
    const hashedPassword = await UserUtils.hashPassword(password);
    await this.authDA.UpdateUserPassword(email, hashedPassword);
    this.forgotPasswordStore.delete(email);
    response.status(200).json({ message: 'Password updated successfully' });
  };

  // TEST ONLY: Delete user by email
  DeleteUserByEmail = async (request: Request, response: Response) => {
    const { email } = request.body;
    if (!email) {
      response.status(400).json({ message: 'Email required' });
      return;
    }
    try {
      await this.authDA.DeleteUserByEmail(email);
      response.status(200).json({ message: 'User deleted (if existed)' });
    } catch (err) {
      response.status(500).json({ message: 'Error deleting user', error: err });
    }
  };
}
