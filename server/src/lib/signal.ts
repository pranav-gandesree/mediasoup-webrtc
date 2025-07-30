import { Server as SocketIOServer, Socket } from "socket.io";
import { Router } from "mediasoup/node/lib/types";
import { createWebRtcTransport, createWorker } from "./mediasoupservice";


let mediasoupRouter: Router;
let producerTransport: any
let consumerTransport: any
let producer: any
let consumer: any

const SocketConnection = async (io: SocketIOServer) => {

  mediasoupRouter = await createWorker();

  io.on("connection", async(socket: Socket) => {
    console.log("New Socket.IO connection:", socket.id);
    
    socket.emit("welcome", "Hello! Message From Server!!");

    
    //when a peer requests for rtp capabilities this request wll send the data 
    //the peer needs to know what codecs are the router supports before creating a transport
    socket.on('getRtpCapabilities', (callback) => {
        const rtpCapabilities= mediasoupRouter.rtpCapabilities;

        console.log("rtp capabilities are", rtpCapabilities);

        callback({rtpCapabilities})
    })
    
    //transport is req for sending or producing media
    socket.on('createWebRtcTransport', async ({sender}, callback)=>{
      console.log("is he sender?", sender);

      if(sender){
        producerTransport = await createWebRtcTransport(mediasoupRouter, callback);
      }else{
        consumerTransport = await createWebRtcTransport(mediasoupRouter, callback);
      }
    })


    //data.dtlsParameters - Datagram Transport Layer Security (DTLS) parameters
    //hese parameters are necessary for securing the transport with encryption
    socket.on('connectProducerTransport', async({dtlsParameters})=>{
        console.log('DTLS PARAMS... ', { dtlsParameters })
      await producerTransport?.connect({dtlsParameters})
    })



    socket.on("transport-produce", async ({ kind, rtpParameters }, callback) => {
      producer = await producerTransport?.produce({
        kind,
        rtpParameters,
      });

      producer?.on("transportclose", () => {
        console.log("Producer transport closed");
        producer?.close();
      });

      callback({ id: producer?.id });
  });

  
  //  for connecting the receiving transport
  //   This step is required before the transport can be used to receive media
  socket.on("connectConsumerTransport", async ({ dtlsParameters }) => {
    await consumerTransport?.connect({ dtlsParameters });
  });


    socket.on("consumeMedia", async ({ rtpCapabilities }, callback) => {
    try {
      // Ensure there's a producer to consume from
      if (producer) {
        // Check if the router can consume the media from the producer based on the RTP capabilities
        if (!mediasoupRouter.canConsume({ producerId: producer?.id, rtpCapabilities })) {
          console.error("Cannot consume");
          return;
        }
        console.log("-------> consume");

        // Create a consumer on the consumer transport
        consumer = await consumerTransport?.consume({
          producerId: producer?.id,
          rtpCapabilities,
          // Pause the consumer initially if it's a video consumer
          // This can help save bandwidth until the video is actually needed
          paused: producer?.kind === "video",
        });

        // Event handler for transport closure
        // This helps ensure that resources are cleaned up when the transport is closed
        consumer?.on("transportclose", () => {
          console.log("Consumer transport closed");
          consumer?.close();
        });

        // Event handler for producer closure
        // This helps ensure that the consumer is closed when the producer is closed
        consumer?.on("producerclose", () => {
          console.log("Producer closed");
          consumer?.close();
        });

        // Invoke the callback with the consumer parameters
        // This allows the client to configure the consumer on its end
        callback({
          params: {
            producerId: producer?.id,
            id: consumer?.id,
            kind: consumer?.kind,
            rtpParameters: consumer?.rtpParameters,
          },
        });
      }
    } catch (error) {
      // Handle any errors that occur during the consume process
      console.error("Error consuming:", error);
      callback({
        params: {
          error,
        },
      });
    }
  });

    socket.on("resumePausedConsumer", async () => {
      console.log("consume-resume");
      await consumer?.resume();
    });



    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};


export { SocketConnection };