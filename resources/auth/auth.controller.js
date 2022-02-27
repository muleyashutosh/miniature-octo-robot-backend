import mongoose from 'mongoose'
import jwt from "../../util/jwt";
import { User } from "../user/user.model";
import { UserApiSigninSchema, UserApiSignupSchema } from "../user/user.schema";
import { RefreshToken } from './refreshToken.model';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY } from '../../util/config';


const signup = async (req, res) => {

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await UserApiSignupSchema.validateAsync(req.body);

    const user = await User.create([req.body], { session: session });
    const accessToken = jwt.newToken(user[0], ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY);
    const refreshToken = jwt.newToken(user[0], REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY);
    await RefreshToken.create([{ token: refreshToken, user: user[0]._id }], { session: session })

    await session.commitTransaction();

    session.endSession();

    res.cookie('jwt', refreshToken, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(201).send({ status: "ok", accessToken });
  } catch (e) {

    console.log(e.message);

    await session.abortTransaction();

    session.endSession();

    const errorResponse = { status: "error" }

    if (e.toString().includes("E11000 duplicate key error collection")) {
      errorResponse.message = `User Already Exists`;
      errorResponse.error = e.message;
    }

    return res.status(400).send(errorResponse);
  }
};

const signin = async (req, res) => {
  try {
    await UserApiSigninSchema.validateAsync(req.body);
    const user = await User.findOne({ email: req.body.email }).exec();
    if (!user) {
      return res.status(400).send({ message: "Invalid Email or Password" });
    }
    const match = await user.checkPassword(req.body.password);
    if (!match) {
      return res.status(401).send({ message: "Invalid Credentials" });
    }
    const accessToken = jwt.newToken(user, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY);
    const refreshToken = jwt.newToken(user, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY);

    res.cookie('jwt', refreshToken, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({ status: "ok", accessToken });
  } catch (e) {
    console.log(e.message);
    const message = { status: "error", message: "Not Authorized" };
    if (!e.message.includes("password")) message.error = e.message;
    return res.status(401).send(message);
  }
};

const refresh = async (req, res) => {
  // generate new access token from refresh token.
  try {
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.sendStatus(403);

    console.log(cookies.jwt)
    const refreshToken = cookies.jwt;

    const refreshTokenData = await RefreshToken.findOne({ token: refreshToken }).populate("user", "email")
    
    if (!refreshTokenData || !refreshTokenData.is_enabled) {
      return res.status(403).json({ "message": "Invalid Refresh Token or email. Contact Admin" });
    }
    
    console.log(refreshTokenData.user.email);

    // evaluate jwt
    const payload = await jwt.verifyToken(refreshTokenData.token, REFRESH_TOKEN_SECRET, refreshTokenData.user)

    const accessToken = jwt.newToken(
      { _id: payload.id, email: payload.email },
      ACCESS_TOKEN_SECRET,
      ACCESS_TOKEN_EXPIRY
    )

    return res.json({ status: "ok", accessToken })

  } catch (e) {
    console.log(e);
    return res.status(500).json({ status: "error", error: 'error', 'message': e })
  }

};

const reject = async (req, res) => {
  try {
    await TokenApiSchema.validateAsync(req.body);

    const doc = await RefreshToken.findOne({ token: req.body.refreshToken }).populate('user', 'email')
    if (!doc || doc.user.email != req.body.email) {
      throw new Error("Invalid Refresh Token or Email")
    }

    doc.is_enabled = false;

    doc.save();

    return res.json({ "message": "Refresh Token revoked" })

  } catch (e) {
    return res.status(400).json({ status: "error", message: "Unable to revoke token", error: e.message })
  }
}

const logout = async (req, res) => {
  // on client, also delete the access token.

  const cookies = req.cookies;

  if (!cookies?.jwt) return res.sendStatus(204);

  console.log(cookies.jwt)
  const refreshToken = cookies.jwt;

  // if refreshToken in DB, delete
  await RefreshToken.findOneAndDelete({ token: refreshToken });

  // clear Cookie
  res.clearCookie('jwt', {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  })

  return res.sendStatus(204);

}




export { signup, signin, refresh, reject, logout };
