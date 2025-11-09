import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { String } from './ScemaValidation';

const CreateNoteSchema = z.object({
  notes: String('Notes', true),
  planId: String('Plan Id', true),
});

type CreateNoteType = z.infer<typeof CreateNoteSchema>;

const ValidateCreateNote = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validateRequest(req, res, next, CreateNoteSchema);
};

export { ValidateCreateNote, CreateNoteSchema, CreateNoteType };
