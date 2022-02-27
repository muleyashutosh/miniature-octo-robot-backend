import express, { urlencoded, json } from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import {SECRETS} from "./util/config";
import { connect } from "./util/db";
import { protect } from "./util/protect";
import AuthRouter from './resources/auth/auth.router'
import TransactionRouter from './resources/transactions/transactions.router'

const app = express();
const PORT = SECRETS.PORT || 3000;

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cookieParser())
app.use(cors());
app.use(morgan("dev"));

app.use('/auth', AuthRouter)

app.use('/transactions', protect, TransactionRouter)

app.get("/", (req, res) => {
  res.json({
    message: "Hello World!",
    user: req.user,
  });
});

export const start = async () => {
  try {
    await connect();
    app.listen(PORT, () => {
      console.log(`App is listening on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
};
