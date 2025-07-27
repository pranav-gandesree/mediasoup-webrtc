
import WebSocket from "ws";
import { createWorker } from "./worker";

let mediasoupRouter;

const WsConnection = async (wss: WebSocket.Server) => {

    try {
         mediasoupRouter = await createWorker();
    } catch (error) {
        throw error;
    }
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
