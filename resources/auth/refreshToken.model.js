import mongoose from "mongoose";
const { model, Schema, SchemaTypes } = mongoose;
import { User } from "../user/user.model";

const RefreshTokenSchema = new Schema({
  token: {
    type: String,
    required: true
  },
  is_enabled: {
    type: Boolean,
    default: true
  },
  user: {
    type: SchemaTypes.ObjectId,
    ref: User,
    required: true
  }
}, {
  timestamps: true
})

export const RefreshToken = new model('RefreshToken', RefreshTokenSchema)