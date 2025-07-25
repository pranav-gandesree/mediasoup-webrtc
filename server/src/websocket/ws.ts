
import WebSocket from "ws";

const WsConnection = async (wss: WebSocket.Server) => {
    wss.on('connection', (ws: WebSocket) => {
        console.log("New WebSocket connection established");

        ws.on('error', console.error);

        ws.on('message', (message: string) => {
            console.log("message is", message);
        });

        ws.send('Hello! Message From Server!!');
    });
};

export { WsConnection };
