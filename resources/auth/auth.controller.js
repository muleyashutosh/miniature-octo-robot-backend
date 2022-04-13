import mongoose from 'mongoose'
import jwt from "../../util/jwt";
import { User } from "../user/user.model";
import { UserApiSigninSchema, UserApiSignupSchema } from "../user/user.schema";
import { RefreshToken } from './refreshToken.model';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY } from '../../util/config';
import { Gateway, Wallets } from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';
import path from 'path';
import { buildCAClient, registerAndEnrollUser, enrollAdmin } from '../../../../test-application/javascript/CAUtil.js';
import { buildCCPOrg1, buildWallet } from '../../../../test-application/javascript/AppUtil.js';
import { fileURLToPath } from 'url';
import { ccp, caClient, wallet } from '../../server'
let contract, userId;
export { contract, userId };

const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const walletPath = path.join(__dirname, 'wallet');

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

    res.cookie('refresh_jwt', refreshToken, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('access_jwt', accessToken, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      maxAge: 60 * 60 * 1000
    });

    
    await registerAndEnrollUser(caClient, wallet, mspOrg1, user[0]._id.toString(), 'org1.department1');
    const gateway = new Gateway();

    await gateway.connect(ccp, {
      wallet,
      identity: user[0]._id.toString(),
      discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });
    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    contract = network.getContract(chaincodeName);
    userId = user[0]._id.toString();

    return res.status(201).send({ status: "ok", accessToken });
  } catch (e) {

    console.log(e.message);

    await session.abortTransaction();

    session.endSession();

    const errorResponse = { status: "error" }

    if (e.toString().includes("E11000 duplicate key error collection")) {
      errorResponse.message = `User Already Exists`;
    }
    else errorResponse.message = e.message;

    errorResponse.error = e.message;
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

    await RefreshToken.findOneAndUpdate({user: user._id}, {token: refreshToken})

    res.cookie('refresh_jwt', refreshToken, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('access_jwt', accessToken, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      maxAge: 60 * 60 * 1000
    });

    const gateway = new Gateway();

    await gateway.connect(ccp, {
      wallet,
      identity: user._id.toString(),
      discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });
    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    contract = network.getContract(chaincodeName);
    userId = user._id.toString();

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

    if (!cookies?.refresh_jwt) return res.sendStatus(403);

    console.log(cookies.refresh_jwt)
    const refreshToken = cookies.refresh_jwt;

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

    res.cookie('access_jwt', accessToken, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      maxAge: 60 * 60 * 1000
    });

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

  if (!cookies?.refresh_jwt) return res.sendStatus(204);

  console.log(cookies.refresh_jwt)
  const refreshToken = cookies.refresh_jwt;

  // if refreshToken in DB, delete
  await RefreshToken.findOneAndDelete({ token: refreshToken });

  // clear Cookie
  res.clearCookie('refresh_jwt', {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  })
  res.clearCookie('access_jwt', {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  })

  return res.sendStatus(204);

}


export { signup, signin, refresh, reject, logout };
