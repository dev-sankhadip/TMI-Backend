import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { String } from './ScemaValidation';

const CreateUserSchema = z
  .object({
    firstName: String('First Name', true),
    lastName: String('Last Name', true),
    email: String('Email', true).email(),
    password: String('Password', false).min(6).optional(),
    otp: z.string().optional(),
  })
  .refine(
    (data) => {
      // Require password if otp is present, and otp if password is present
      if ((data.otp && !data.password) || (data.password && !data.otp)) {
        return false;
      }
      return true;
    },
    {
      message: 'Password and OTP must both be provided together',
      path: ['password', 'otp'],
    }
  );

type CreateUserType = z.infer<typeof CreateUserSchema>;

const ValidateCreateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validateRequest(req, res, next, CreateUserSchema);
};

export { ValidateCreateUser, CreateUserSchema, CreateUserType };
