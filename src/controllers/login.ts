import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";

import User from "../models/user";
import config from "../utils/config";

const loginRouter = Router();

loginRouter.get(
  "/self",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user) {
      res.send(req.user);
    } else {
      res.status(401).end();
    }
  }
);

loginRouter.post("/", async (request: Request, response: Response) => {
  try {
    const { username, password } = request.body;

    if (!username || !password) {
      return {
        error: "provide all required fields",
      };
    }

    const user = await User.findOne({ username });

    const passwordCorrect =
      user === null ? false : await bcrypt.compare(password, user.passwordHash);

    if (!(user && passwordCorrect)) {
      return response.status(401).json({
        error: "invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        data: user,
      },
      config.SECRET,
      { expiresIn: 60 * 60 }
    );

    response.json({ token });
  } catch (e) {
    console.log("wrong credentials");
    response.status(401).end();
  }
});

export default loginRouter;
