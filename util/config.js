import { config } from "dotenv";
config();

const SECRETS = {
  mongodb_connection_string: process.env.MONGO_CONNECTION_STRING,
  jwt: process.env.JWT_SECRET,
  jwtExp: "100d",
};

export default SECRETS;