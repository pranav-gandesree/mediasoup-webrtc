// lib/signal.ts

import { Server as SocketIOServer, Socket } from "socket.io";
import { createWorker } from "./worker";
import { Router } from "mediasoup/node/lib/types";

let mediasoupRouter: Router;

const SocketConnection = async (io: SocketIOServer) => {
  // Optional: Initialize mediasoup
  // mediasoupRouter = await createWorker();

  io.on("connection", (socket: Socket) => {
    console.log("New Socket.IO connection:", socket.id);

    socket.emit("welcome", "Hello! Message From Server!!");

    socket.on("message", (data) => {
      console.log("Raw message received:", data);
    });

    
    socket.on("createTransport", async ({ sender }, callback) => {
      console.log("createTransport triggered, sender:", sender);
      
      const transport = {
        id: "dummy-id",
        iceParameters: {},
        iceCandidates: [],
        dtlsParameters: {}
      };

      callback(transport);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

export { SocketConnection };
