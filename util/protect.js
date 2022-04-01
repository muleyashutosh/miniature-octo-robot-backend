import jwt from './jwt';
import { User } from '../resources/user/user.model';
import { ACCESS_TOKEN_EXPIRY, ACCESS_TOKEN_SECRET } from './config';

const protect = async (req, res, next) => {

  const cookies = req.cookies;

  if (!cookies?.access_jwt) return res.sendStatus(401);

  console.log(cookies.access_jwt)
  const accessToken = cookies.access_jwt;

  try {
    const payload = await jwt.verifyToken(accessToken, ACCESS_TOKEN_SECRET);
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