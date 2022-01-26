import express, { urlencoded, json } from "express";
import morgan from "morgan";
import cors from "cors";
import SECRETS from "./util/config";
import { connect } from "./util/db";
import { signin, signup, protect } from "./util/auth";

const app = express();
const PORT = SECRETS.PORT || 3000;

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cors());
app.use(morgan("dev"));

app.post("/signin", signin);
app.post("/signup", signup);

app.get("/", protect, (req, res) => {
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
