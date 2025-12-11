declare module 'simple-peer' {
  interface SimplePeerOptions {
    initiator?: boolean;
    trickle?: boolean;
    stream?: MediaStream;
    config?: RTCConfiguration;
    channelConfig?: RTCDataChannelInit;
  }

  interface SimplePeerData {
    type: string;
    [key: string]: any;
  }

  export interface Instance {
    destroyed: boolean;
    signal: (data: any) => void;
    send: (data: string | Buffer | ArrayBuffer) => void;
    destroy: () => void;
    on: (event: string, listener: Function) => void;
    removeListener: (event: string, listener: Function) => void;
  }

  export default class SimplePeer {
    constructor(options?: SimplePeerOptions);
    static WEBRTC_SUPPORT: boolean;
    destroyed: boolean;
    signal: (data: any) => void;
    send: (data: string | Buffer | ArrayBuffer) => void;
    destroy: () => void;
    on: (event: string, listener: Function) => void;
    removeListener: (event: string, listener: Function) => void;
  }

  export { SimplePeer };
}