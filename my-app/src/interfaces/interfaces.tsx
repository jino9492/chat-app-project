import { Method } from "@testing-library/react";
import io, { Socket } from "socket.io-client";

export default interface SocketProps{
    userName: string;
    curRoom: string;
    setCurRoom : any;
}

export default interface SocketState{
    userName: string;
    curRoom: string;
    setCurRoom : any;
}