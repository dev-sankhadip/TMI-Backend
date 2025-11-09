import { z } from 'zod';
import { String } from './ScemaValidation';

const TimeSchema = (fieldName: string) =>
  z.number({
    required_error: `${fieldName} is required`,
    invalid_type_error: `${fieldName} must be of type number`,
  });

const BasePlanSchema = z.object({
  title: String('Title', true),
  description: String('Description', true),
  startTime: TimeSchema('Start Time'),
  endTime: TimeSchema('End Time'),
  planReferences: z
    .array(
      z.object({
        hyperLink: z.string().nullable(),
        description: z.string().nullable(),
      })
    )
    .optional(),
  breaks: z
    .array(
      z.object({
        startTime: TimeSchema('Break Start Time'),
        endTime: TimeSchema('Break End Time'),
      })
    )
    .optional(),
});

export { BasePlanSchema };
