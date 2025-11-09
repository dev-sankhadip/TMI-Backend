import { NextFunction, Request, Response } from 'express';
import { BasePlanSchema } from './CreatePlan';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';
import { String } from './ScemaValidation';

const UpdatePlanSchema = BasePlanSchema.extend({
  planId: String('Plan Id', true),
});

type UpdatePlanType = z.infer<typeof UpdatePlanSchema>;

const ValidateUpdatePlan = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validateRequest(req, res, next, UpdatePlanSchema);
};

export { ValidateUpdatePlan, UpdatePlanType };
