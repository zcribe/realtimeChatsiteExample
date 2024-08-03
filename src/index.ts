import express from "express";
import mongoose from "mongoose";
import type { Request, Response } from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Server } from "socket.io";
import cors from "cors";

import config from "./utils/config";
import loginRouter from "./controllers/login";
import userRouter from "./controllers/user";
import messageRouter from "./controllers/message";
import Message from "./models/message";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
    }
  }
}

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(cors());

app.use(express.static(join(__dirname, 'public')));

mongoose
  .connect(config.MONGO_URI)
  .then(() => {
    console.log("Connected to the Database");
  })
  .catch((error) => {
    console.log("Error connecting to the Database", error.message);
  });

const jwtDecodeOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.SECRET,
};

passport.use(
  new JwtStrategy(jwtDecodeOptions, (payload, done) => {
    return done(null, payload.data);
  })
);

const io = new Server(server);

let usersInRoom: string[] = [];

io.engine.use(
  (req: { _query: Record<string, string> }, res: Response, next: Function) => {
    const isHandshake = req._query.sid === undefined;
    if (isHandshake) {
      passport.authenticate("jwt", { session: false })(req, res, next);
    } else {
      next();
    }
  }
);

io.on("connection", (socket) => {
  const req = socket.request as Request & { user: Express.User };
  let addedUser = false;

  socket.join(`user:${req.user.id}`);

  if (!addedUser && !usersInRoom.includes(req.user.username)){
    usersInRoom.push(req.user.username)
    addedUser = true
  }

  io.emit('members', usersInRoom);

  socket.on("whoami", (cb) => {
    cb(req.user.username);
  });

  socket.on('chat message', async (msg) => {
    const newMessage = new Message({author: req.user.username, message: msg })
    const savedMessage = await newMessage.save();
    const messageWithId = `${savedMessage.author}: ${savedMessage.message}`
    io.emit('chat message', messageWithId);
  });

  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: req.user.username
    });
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: req.user.username
    });
  });

  socket.on('disconnect', () => {
    if (addedUser) {
      usersInRoom = usersInRoom.filter( i => i !== req.user.username)

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: req.user.username,
      });

      io.emit('members', usersInRoom)
    }
  });

  
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/login", loginRouter)
app.use("/api/v1/message", messageRouter)

server.listen(config.PORT, () => {
  console.log(`application is running at: http://127.0.0.1:${config.PORT}`);
});
