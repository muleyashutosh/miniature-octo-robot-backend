import joi from "joi";

export const UserApiSignupSchema = joi.object({
  firstName: joi.string().required(),
  lastName: joi.string().required(),
  email: joi.string().email().required(),
  password: joi
    .string()
    .min(8)
    .regex(/[A-Z]/, "at least one upper-case")
    .regex(/[a-z]/, "at least one lower-case")
    .regex(/[^\w]/, "at least one special character")
    .regex(/[0-9]/, "at least one number")
    .required(),
});

export const UserApiSigninSchema = joi.object({
  email: joi.string().email().required(),
  password: joi
    .string()
    .min(8)
    .regex(/[A-Z]/, "at least one upper-case")
    .regex(/[a-z]/, "at least one lower-case")
    .regex(/[^\w]/, "at least one special character")
    .required(),
});
