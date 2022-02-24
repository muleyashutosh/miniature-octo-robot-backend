import mongoose from 'mongoose'
import randToken from 'rand-token';
import jwt from "../../util/jwt";
import { User } from "../user/user.model";
import { UserApiSchema } from "../user/user.schema";
import { TokenApiSchema } from './auth.schema';
import { RefreshToken } from './refreshToken.model';


const signup = async (req, res) => {
  
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
  
    await UserApiSchema.validateAsync(req.body);

    const user = await User.create([req.body], {session: session});
    const token = jwt.newToken(user[0]);
    const randomToken = randToken.uid(256);
    const refreshtoken = await RefreshToken.create([{token: randomToken, user: user[0]._id }], { session: session })

    await session.commitTransaction();

    session.endSession();

    return res.status(201).send({ status: "ok", access_token: token, refresh_token: refreshtoken[0].token });
  } catch (e) {

    console.log(e.message);
    
    await session.abortTransaction();

    session.endSession();

    const errorResponse = {status: "error"}

    if (e.toString().includes("E11000 duplicate key error collection")) {
      errorResponse.message = `User Already Exists`;
      errorResponse.error = e.message;
    }

    return res.status(400).send(errorResponse);
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
    const message = { status:"error", message: "Not Authorized" };
    if (!e.message.includes("password")) message.error = e.message;
    return res.status(401).send(message);
  }
};

const refresh = async (req,res) => {
  // generate new access token from refresh token.
  try {
    await TokenApiSchema.validateAsync(req.body)

    const refresh_token_data = await RefreshToken.findOne({token: req.body.refreshToken}).populate("user", "email")
    console.log(refresh_token_data.user.email);

    if(!refresh_token_data || refresh_token_data.user.email !== req.body.email || !refresh_token_data.is_enabled) {
      return res.status(400).json({"message": "Invalid Refresh Token or email. Contact Admin"});
    }
    
    const accessToken = jwt.newToken(refresh_token_data.user)

    return res.json({"access_token": accessToken })

  } catch (e) {
    console.log(e.message);
    return res.status(500).json({status:"error", error: 'error', 'message': e.message})
  }

};

const reject = async (req, res) => {
  try {
    await TokenApiSchema.validateAsync(req.body);
  
    const doc = await RefreshToken.findOne({token: req.body.refreshToken}).populate('user', 'email')
    if(!doc || doc.user.email != req.body.email) {
      throw new Error("Invalid Refresh Token or Email")
    }

    doc.is_enabled = false;

    doc.save();

    return res.json({"message": "Refresh Token revoked"})

  } catch(e) {
    return res.status(400).json({status: "error", message: "Unable to revoke token", error: e.message})
  }
}

export { signup, signin, refresh, reject };
