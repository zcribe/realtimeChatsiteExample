import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/user";
import config from "../utils/config";

const loginRouter = Router();

loginRouter.post("/", async (request: Request, response: Response) => {
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

  const userForToken = {
    username: user.username,
    id: user._id
  }

  const token = jwt.sign(
    userForToken,
    config.SECRET,
    {expiresIn: 60*60}
  )
  

  response.status(200).send({token, username: user.username });
});

export default loginRouter;
