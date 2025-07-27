import { main } from './server'

main()










// import express from 'express'
// import { WebSocketServer } from 'ws'

// const app = express()
// const httpServer = app.listen(3483, ()=>{
//     console.log("server is running on port 3483")
// })

// const wss = new WebSocketServer({ server: httpServer });

// wss.on('connection', function connection(ws) {
//   ws.on('error', console.error);

//   ws.on('message', function message(data, isBinary) {
//     wss.clients.forEach(function each(client) {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(data, { binary: isBinary });
//       }
//     });
//   });

//   ws.send('Hello! Message From Server!!');
// });