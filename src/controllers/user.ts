import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";

import User from "../models/user";

const userRouter = Router();

userRouter.get("/", async (request: Request, response: Response) => {
  response.send("Hello World!");
});

userRouter.post("/", async (request: Request, response: Response) => {
  const { username, password } = request.body;

  if (!username || !password){
    return {
      error: 'provide all required fields'
    }
  }

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    response.status(400).json({ error: "username already taken" });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const newUser = new User({
    username,
    passwordHash
  })

  const savedUser = await newUser.save();

  response.status(201).json(savedUser)
});

export default userRouter;
