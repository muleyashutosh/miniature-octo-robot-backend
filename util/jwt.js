import jwt from "jsonwebtoken";
import {SECRETS} from "./config";

const newToken = (user, key, expiry) => {
  return jwt.sign({ id: user._id, email: user.email }, SECRETS[key], {
    expiresIn: expiry,
  });
};

const customChecker = (x, y) => {
  return (x.id != y._id || x.email !== y.email);
}


const verifyToken = (token, key, user=null) => {  
  return new Promise((resolve, reject) => {
    jwt.verify(token, SECRETS[key], (err, payload) => {
      let check = false;
      if (user) check = customChecker(payload, user);
      console.log(payload, user, check, err || check, err)
      if (err || check) return reject(err);
      resolve(payload);
    })
  });
}

export default {
  newToken, verifyToken
}
