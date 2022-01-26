import joi from "joi";

export const UserApiSchema = joi.object({
  email: joi.string().email().required(),
  password: joi
    .string()
    .min(8)
    .regex(/[A-Z]/, "at least one upper-case")
    .regex(/[a-z]/, "at least one lower-case")
    .regex(/[^\w]/, "at least one special character")
    .required(),
});
