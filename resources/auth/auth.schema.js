import joi from "joi";

export const TokenApiSchema = joi.object({
  email: joi.string().email().required(),
  refreshToken: joi.string().length(256).required()
});
