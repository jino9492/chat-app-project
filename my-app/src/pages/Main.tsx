import React from "react";
import ChatBox from "../components/ChatBox"

export default class Main extends React.Component{
    constructor(props:any){
        super(props);

        this.state = {};
    }

    render(){
        return(
            <ChatBox></ChatBox>
        )
    }
}