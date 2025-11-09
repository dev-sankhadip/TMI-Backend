import { z } from 'zod';

export const String = (fieldName: string, required: boolean) => {
  let schema = z.string({
    invalid_type_error: `${fieldName} must be of type string`,
  });
  if (required) {
    schema = schema.min(1, { message: `${fieldName} is required` });
  }
  return schema;
};

export const Number = (fieldName: string, required: boolean = true) => {
  let schema = z.number({
    invalid_type_error: `${fieldName} must be of type number`,
  });
  return schema;
};
