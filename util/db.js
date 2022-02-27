import mongoose from "mongoose";
import {SECRETS} from "./config";

export const connect = (url = SECRETS.MONGO_CONNECTION_STRING) => {
  return mongoose.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
};
