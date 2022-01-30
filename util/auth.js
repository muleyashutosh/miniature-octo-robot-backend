import { User } from "../resources/user/user.model";
import { UserApiSchema } from "../resources/user/user.schema";
import jwt from "./jwt";

const signup = async (req, res) => {
  try {
    const value = await UserApiSchema.validateAsync(req.body);
    const user = await User.create(req.body);
    const token = jwt.newToken(user);
    return res.status(201).send({ status: "ok", token: token });
  } catch (e) {
    console.log(e.message);
    if (e.toString().includes("E11000 duplicate key error collection")) {
      return res.status(400).send({
        status: `User Already Exists`,
      });
    }
    return res.status(400).send({ status: "error", error: e.message });
  }
};

const signin = async (req, res) => {
  try {
    await UserApiSchema.validateAsync(req.body);
    const user = await User.findOne({ email: req.body.email }).exec();
    if (!user) {
      return res.status(400).send({ message: "Invalid Email or Password" });
    }
    const match = await user.checkPassword(req.body.password);
    if (!match) {
      return res.status(401).send({ message: "Invalid Credentials" });
    }
    const token = jwt.newToken(user);
    return res.status(200).send({ status: "ok", token: token });
  } catch (e) {
    console.log(e.message);
    const message = { message: "Not Authorized" };
    if (!e.message.includes("password")) message.error = e.message;
    return res.status(401).send(message);
  }
};

const protect = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).end();
  }
  let token = req.headers.authorization.split("Bearer ")[1];
  if (!token) {
    return res.status(401).end();
  }
  try {
    const payload = await jwt.verifyToken(token);
    console.log(payload);
    const user = await User.findById(payload.id).select("-password");
    req.user = user;
    next();
  } catch (e) {
    console.log(e);
    return res.status(401).end();
  }
};

export { signup, signin, protect };
