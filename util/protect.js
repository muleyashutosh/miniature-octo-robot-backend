import jwt from './jwt';
import { User } from '../resources/user/user.model';
import { ACCESS_TOKEN_EXPIRY, ACCESS_TOKEN_SECRET } from './config';

const protect = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).end();
  }
  let token = req.headers.authorization.split("Bearer ")[1];
  console.log(token)
  if (!token) {
    return res.status(401).end();
  }
  try {
    const payload = await jwt.verifyToken(token, ACCESS_TOKEN_SECRET);
    console.log(payload);
    const user = await User.findById(payload.id).select("-password");
    req.user = user;
    next();
  } catch (e) {
    console.error(e);
    return res.status(401).end();
  }
};

export {protect};