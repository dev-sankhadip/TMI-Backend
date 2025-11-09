import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { Number, String } from './ScemaValidation';

const CreatePlanReviewSchema = z.object({
  percentage: Number('Notes', true),
  planId: String('Plan Id', true),
});

type CreatePlanReviewType = z.infer<typeof CreatePlanReviewSchema>;

const ValidateCreatePlanReview = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validateRequest(req, res, next, CreatePlanReviewSchema);
};

export {
  ValidateCreatePlanReview,
  CreatePlanReviewSchema,
  CreatePlanReviewType,
};
