// import { main } from './server'

// main()










import express from 'express'
import { WebSocketServer } from 'ws'

const app = express()
const httpServer = app.listen(8080, ()=>{
    console.log("server is running on port 8080")
})

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data, isBinary) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  ws.send('Hello! Message From Server!!');
});