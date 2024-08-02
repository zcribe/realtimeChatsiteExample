import express from "express";
import type { Request, Response } from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";

import config from "./utils/config";
import loginRouter from "./controllers/login";
import userRouter from "./controllers/user";

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

app.get("/", (request: Request, response: Response) => {
  response.sendFile(join(__dirname, "public/index.html"));
});


app.get(
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


app.post("/login", (req, res) => {
  if (req.body.username === "john" && req.body.password === "changeit") {
    console.log("authentication OK");

    const user = {
      id: 1,
      username: "john",
    };

    const token = jwt.sign(
      {
        data: user,
      },
      config.SECRET,
      { expiresIn: 60 * 60 }
    );

    res.json({ token });
  } else {
    console.log("wrong credentials");
    res.status(401).end();
  }
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

  socket.join(`user:${req.user.id}`);

  socket.on("whoami", (cb) => {
    cb(req.user.username);
  });

  socket.on('chat message', (msg) => {
    const messageWithId = `${req.user.username}: ${msg}`
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

  
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/login", loginRouter)

server.listen(config.PORT, () => {
  console.log(`application is running at: http://127.0.0.1:${config.PORT}`);
});
