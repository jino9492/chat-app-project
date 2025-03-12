import React, { useState } from "react";
import ChatBox from "../components/ChatBox"
import RoomSelectBox from "../components/RoomSelectBox";
import io, { Socket } from "socket.io-client";
import SocketState from "../interfaces/interfaces"


export default class Main extends React.Component<any,SocketState>{
    constructor(props:any){
        super(props);

        const tempName = "anoymous";
        const curRoom = "";
        this.setCurRoom = this.setCurRoom.bind(this);

        this.state = {
            userName: tempName,
            curRoom: curRoom,
            setCurRoom: this.setCurRoom,
        };
    }

    setCurRoom(curRoom: string) {
        this.setState({curRoom: curRoom});
    }

    render(){
        return(
            <div>
                <ChatBox
                userName={this.state.userName}
                curRoom={this.state.curRoom}
                setCurRoom={this.state.setCurRoom}
                />
                <RoomSelectBox
                userName={this.state.userName}
                curRoom={this.state.curRoom}
                setCurRoom={this.state.setCurRoom}
                />
            </div>
        )
    }
}