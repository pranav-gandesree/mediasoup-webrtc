import * as mediasoup from "mediasoup";
import { config } from "../config";
import { Worker, Router, WebRtcTransport } from "mediasoup/node/lib/types";

const workers: Array<{
    worker: Worker,
    router: Router
}> = [];


const createWorker = async () =>{
    const worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.worker.logLevel as mediasoup.types.WorkerLogLevel,
    logTags: config.mediasoup.worker.logTags as mediasoup.types.WorkerLogTag[],
    rtcMinPort: config.mediasoup.worker.rtcMinPort,
    rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    disableLiburing: config.mediasoup.worker.disableLiburing
});

    worker.on('died', () => {
        console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
        setTimeout(() => process.exit(1), 2000);
    });

    // Ensure kind is 'audio' or 'video' as required by mediasoup's MediaKind type
    const mediaCodecs = config.mediasoup.router.mediaCodes.map((codec: any) => ({
        ...codec,
        kind: codec.kind === 'audio' ? 'audio' : 'video'
    }));
    const mediasoupRouter = await worker.createRouter({ mediaCodecs });

    return mediasoupRouter

}



const createWebRtcTransport = async (router: Router, callback: any): Promise<WebRtcTransport | undefined> => {
    try {
        const webRtcTransport_options = {
            listenIps: [
                {
                    ip: '0.0.0.0',
                    announcedIp: '127.0.0.1',
                }
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        };

        let transport = await router.createWebRtcTransport(webRtcTransport_options);
        console.log(`transport id: ${transport.id}`);

        transport.on('dtlsstatechange', dtlsState => {
            if (dtlsState === 'closed') {
                transport.close();
            }
        });

        transport.on('routerclose', () => {
            console.log('transport closed');
        });

        callback({
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
            }
        });

        return transport;

    } catch (error) {
        console.log(error);
        callback({
            params: {
                error: error
            }
        });
        return undefined;
    }
};


export {createWorker, createWebRtcTransport}