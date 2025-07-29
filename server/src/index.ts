import express from 'express';
import { Server as SocketIOServer } from "socket.io";
import http from 'http';
import { SocketConnection } from './lib/signal'; 

const main = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
    path: "/mediasoup",
  });

  await SocketConnection(io);

  httpServer.listen(8080, () => {
    console.log("Server is running on http://localhost:8080");
  });
};

main();
