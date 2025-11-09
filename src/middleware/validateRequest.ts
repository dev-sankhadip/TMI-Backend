import { NextFunction, Request, Response } from 'express';
import { z, ZodSchema } from 'zod';
/**
 * Middleware to validate the request body against a provided Zod schema.
 *
 * @param req - The Express request object containing the data to be validated.
 * @param res - The Express response object used to send error responses if validation fails.
 * @param next - The Express next function used to pass control to the next middleware if validation succeeds.
 * @param schema - The Zod schema used to validate the request body. It defines the expected structure and types.
 */
function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction,
  schema: ZodSchema<any>
) {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        error.errors.map((x) => {
          return { message: x.message };
        })
      );
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export { validateRequest };
