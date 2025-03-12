import React, { useCallback, useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import classNames from "classnames";
import "../styles/RoomSelectBox.css";
import SocketProps from "interfaces/interfaces";

const RoomSelectBox: React.FC<SocketProps> = (props) => {
    const changeRoom = (roomName:string) => {
        console.log(roomName);
        props.setCurRoom(roomName);
    }

    return(
        <div>
            <div onClick={() => changeRoom("room1")}>room1 </div>
            <div onClick={() => changeRoom("room2")}>room2 </div>
            <div>room3 </div>
        </div>
    )
}

export default RoomSelectBox;