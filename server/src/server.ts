import express from 'express';
import * as WebSocket from 'ws';
import http from 'http';
import { WsConnection } from './lib/ws';


const main = async() =>{
    const app = express();
    const server = http.createServer(app);
    const  websocket = new WebSocket.Server({server, path: "/ws"});

    WsConnection(websocket);


    server.listen(8080, ()=>{
        console.log("server is running on port 8080");
    })
}

export {main}