import { Router, type Request, type Response } from "express";
import passport from "passport"

import Message from "../models/message";

const messageRouter = Router();

messageRouter.get("/",
    passport.authenticate("jwt", { session: false }),
     async (request: Request, response: Response) => {
    const messages = await Message.find({})
    response.status(200).send(messages)
})

messageRouter.post("/",
      passport.authenticate("jwt", { session: false }),
 async (request: Request, response: Response) => {
  const { message, author } = request.body;

  if (!message || !author){
    return {
      error: 'provide all required fields'
    }
  }
  const newMessage = new Message({
    message,
    author
  })

  const savedMessage = await newMessage.save();

  response.status(201).json(savedMessage)
});

export default messageRouter;
