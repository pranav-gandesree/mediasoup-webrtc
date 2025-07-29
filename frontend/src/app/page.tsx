"use client";

import { useEffect, useRef, useState } from "react";
import { Device, types as mediasoupTypes } from "mediasoup-client";

type TransportParams = {
  id: string;
  iceParameters: mediasoupTypes.IceParameters;
  iceCandidates: mediasoupTypes.IceCandidate[];
  dtlsParameters: mediasoupTypes.DtlsParameters;
  error?: string;
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [params, setParams] = useState<any>({
    encoding: [
      { rid: "r0", maxBitrate: 100000, scalabilityMode: "S1T3" },
      { rid: "r1", maxBitrate: 300000, scalabilityMode: "S1T3" },
      { rid: "r2", maxBitrate: 900000, scalabilityMode: "S1T3" },
    ],
    codecOptions: { videoGoogleStartBitrate: 1000 },
  });

  const [device, setDevice] = useState<Device | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [rtpCapabilities, setRtpCapabilities] = useState<any>(null);
  const [producerTransport, setProducerTransport] =
    useState<mediasoupTypes.Transport | null>(null);
  const [consumerTransport, setConsumerTransport] =
    useState<mediasoupTypes.Transport | null>(null);

  // ✅ WebSocket setup
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000/mediasoup");

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      ws.send(JSON.stringify({ action: "getRouterRtpCapabilities" }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch (data.action) {
        case "routerRtpCapabilities":
          setRtpCapabilities(data.routerRtpCapabilities);
          await createDevice(data.routerRtpCapabilities);
          break;

        case "createTransportResponse":
          await handleCreateTransportResponse(data.params);
          break;

        case "produceResponse":
          console.log("✅ Producer created, id:", data.id);
          break;

        case "connectProducerTransportResponse":
          console.log("✅ Producer Transport Connected");
          break;

        case "consumeResponse":
          await handleConsumeResponse(data.params);
          break;

        default:
          console.log("⚠ Unknown message:", data);
      }
    };

    ws.onclose = () => console.log("❌ WebSocket disconnected");
    ws.onerror = (error) => console.error("❌ WebSocket error:", error);

    setSocket(ws);
    return () => ws.close();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setParams((curr: any) => ({ ...curr, track: stream.getVideoTracks()[0] }));
    } catch (error) {
      console.error("❌ Camera error:", error);
    }
  };

  const createDevice = async (rtpCaps: any) => {
    try {
      const newDevice = new Device();
      await newDevice.load({ routerRtpCapabilities: rtpCaps });
      setDevice(newDevice);
      console.log("✅ Device created");
    } catch (err: any) {
      if (err.name === "UnsupportedError") {
        console.error("❌ Browser not supported");
      }
    }
  };

  const createSendTransport = async () => {
    if (!socket) return;
    socket.send(JSON.stringify({ action: "createTransport", sender: true }));
  };

  const handleCreateTransportResponse = async (params: TransportParams) => {
    if (!device) return;
    const transport = device.createSendTransport(params);
    setProducerTransport(transport);

    transport.on(
      "connect",
      ({ dtlsParameters }, callback, errback) => {
        try {
          socket?.send(
            JSON.stringify({
              action: "connectProducerTransport",
              dtlsParameters,
            })
          );
          callback();
        } catch (err: any) {
          errback(err);
        }
      }
    );

    transport.on(
      "produce",
      ({ kind, rtpParameters }, callback, errback) => {
        try {
          socket?.send(
            JSON.stringify({ action: "produce", kind, rtpParameters })
          );
          callback({ id: "pending" }); // server will respond later
        } catch (err: any) {
          errback(err);
        }
      }
    );
    console.log("✅ Producer Transport created");
  };

  const connectSendTransport = async () => {
    let producer = await producerTransport?.produce(params);
    producer?.on("trackended", () => console.log("trackended"));
    producer?.on("transportclose", () => console.log("transport closed"));
  };

  const createRecvTransport = async () => {
    if (!socket) return;
    socket.send(JSON.stringify({ action: "createTransport", sender: false }));
  };

  const handleConsumeResponse = async (params: any) => {
    if (!consumerTransport || !device) return;

    const consumer = await consumerTransport.consume({
      id: params.id,
      producerId: params.producerId,
      kind: params.kind,
      rtpParameters: params.rtpParameters,
    });

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = new MediaStream([consumer.track]);
    }
    socket?.send(JSON.stringify({ action: "resumeConsumer" }));
  };

  const connectRecvTransport = async () => {
    socket?.send(
      JSON.stringify({
        action: "consume",
        rtpCapabilities: device?.rtpCapabilities,
      })
    );
  };

  return (
    <main>
      <video ref={videoRef} autoPlay playsInline muted width={300}></video>
      <video ref={remoteVideoRef} autoPlay playsInline width={300}></video>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={createSendTransport}>Create Send Transport</button>
        <button onClick={connectSendTransport}>Produce</button>
        <button onClick={createRecvTransport}>Create Recv Transport</button>
        <button onClick={connectRecvTransport}>Consume</button>
      </div>
    </main>
  );
}
