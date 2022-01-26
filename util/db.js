import mongoose from "mongoose";
import SECRETS from "./config";

export const connect = (url = SECRETS.mongodb_connection_string) => {
  return mongoose.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
};
