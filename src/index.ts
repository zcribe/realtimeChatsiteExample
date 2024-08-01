import express from "express";
import type { Request, Response } from "express";
import { createServer } from "node:http";
import { dirname, join } from "node:path";

const app = express();
const server = createServer(app);

app.get('/', (request: Request, response: Response) => {
  response.send('<h1>Hello world</h1>');
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});