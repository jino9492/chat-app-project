import React, { useCallback, useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";
import io from "socket.io-client";
import "../styles/ChatBox.css";
import sendIcon from "../assets/send_message_icon.png";
import addImageIcon from "../assets/add_image_icon.png";
import removeUploadedImageIcon from "../assets/remove_uploaded_file_icon.png"
import classNames from "classnames";
import { type } from "@testing-library/user-event/dist/type";

const tempName = "anoymous";

const socket = io('http://localhost:8000');
socket.emit("init", { name: tempName });

interface ChatData{
  name: string;
  message: string;
  date: string | null;
  timeData: number | null;
}

const ChatBox = () => {
  const inputRef = useRef<HTMLInputElement>(document.createElement("input"));
  const chatBoxRef = useRef<HTMLDivElement>(document.createElement("div"));
  const imageInputRef = useRef<HTMLInputElement>(document.createElement("input"));

  const [chatArr, setChatArr] = useState<any[]>([]);
  const [chat, setChat] = useState<ChatData>({name: tempName, message: "", date: null, timeData: null});
  const [uploadedImageFile, setUploadedImageFile] = useState<File[]>([]);

  const [fileArrayIsEmpty, setFileArrayIsEmpty] = useState<boolean>(true);

  useEffect(() => {
    socket.on("receive message", (message) => {
      setChatArr((chatArr) => chatArr.concat(message));
    });

    socket.on("recieve image-file", (data) => {
      let TYPED_ARRAY = new Uint8Array(data.file);
      const STRING_CHAR = TYPED_ARRAY.reduce((data, byte)=> {
        return data + String.fromCharCode(byte);
      }, '');
      let base64String = btoa(STRING_CHAR);
      const imageurl = "data:image/jpg;base64," + base64String;
      setChatArr((chatArr) => chatArr.concat([{name: tempName, message: imageurl, date:data.date, timeData:data.timeData}]));
    });
  }, []);

  useEffect(() => {
    chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chatArr]);

  // imageFile이 변경되면 배열이 비었는 지 검사.
  useEffect(() => {
    console.log(uploadedImageFile);
    for(let el in uploadedImageFile){
      return;
    }
    setFileArrayIsEmpty(true);
  }, [uploadedImageFile]);

  const textClear = () => {
    inputRef.current.value = "";
    setChat({name: tempName, message: "", date: null, timeData: null})
  }

  const timestamp = (now:Date) => {
    // 미국시간 기준이니까 9를 더해주면 대한민국 시간됨
    now.setHours(now.getHours() + 9);
    // 문자열로 바꿔주고 T를 빈칸으로 바꿔주면 yyyy-mm-dd hh:mm:ss 이런 형식 나옴
    return now.toISOString().replace("T", " ").substring(0, 19);
  }

  // 현재 메세지와 이전 메세지의 시간차가 1분 이하라면 true 리턴.
  const checkMessageInterval = (timeDiff:number) => {
    if(timeDiff / (60 * 1000) <= 1)
      return true;
    else
      return false;
  }

  const buttonHandler = () => {
    const curDate = new Date();
    const curDateFormatted = timestamp(curDate);

    if (chat.message != ""){
      socket.emit("send message", { name: tempName, message: chat.message, date: curDateFormatted, timeData: curDate.getTime()});
      textClear();
    }

    if (!fileArrayIsEmpty){
      uploadedImageFile.map((el) => {
        socket.emit("send image-file", { name: tempName, file: el, date: curDateFormatted, timeData: curDate.getTime() });
      });

      setUploadedImageFile([]);
    }
  };

  const imageUploadButtonHandler = () => {
    imageInputRef.current.click();
  }

  const imageUploaded = (e:React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files != null){
      for(let i = 0; i < e.target.files.length; i++){
        let file = [e.target.files![i]];
        setUploadedImageFile((imageFile) => imageFile.concat(file));
      }
    }

    setFileArrayIsEmpty(false);
  }

  const removeUploadedImage = (index:number) => {
    setUploadedImageFile((imageFile) => {
      delete imageFile[index];
      return imageFile;
    });

    // 빈 배열을 concat해서 배열의 상태를 변화시킨 뒤 re-render
    setUploadedImageFile((imageFile) => imageFile.concat([]));
  }

  const keyEventHandler = (e:React.KeyboardEvent<HTMLInputElement>) => {
    if(e.keyCode == 13){
      buttonHandler();
    }
  }

  const changeMessage = useCallback((e:React.ChangeEvent<HTMLInputElement>) => {
    setChat({ name: tempName, message: e.target.value, date: null, timeData: null});
  }, [chat]);

  return (
    <div className="chat-box__container">
      <div></div>
      <div className="chat-box__window" ref={chatBoxRef}>
        {chatArr.map((element, index, array) => {
          let preIdx = 0;
          if(index > 0)
            preIdx = index - 1;
          console.log(element.message.search("(data:image)\/(jpg;base64,)"));
          if(!element.message.search("(data:image)\/(jpg;base64,)")){
            if(!checkMessageInterval(array[index].timeData - array[preIdx].timeData) || (preIdx <= 0 && index <= 0))
              return(
                <div className="chat-box__chat">
                  <div className="chat-box__chatter-name">{element.name}<div className="chat-box__chat-time">{element.date}</div></div>
                  <img className="chat-box__chat-image" src={element.message}></img>
                </div>
              )
            else
              return(
                <div className="chat-box__chat">
                  <img className="chat-box__chat-image" src={element.message}></img>
                </div>
              )
          }
          else{
            if(!checkMessageInterval(array[index].timeData - array[preIdx].timeData) || (preIdx <= 0 && index <= 0))
              return(
                <div className="chat-box__chat">
                  <div className="chat-box__chatter-name">{element.name}<div className="chat-box__chat-time">{element.date}</div></div>
                  <div className="chat-box__chat-log">{element.message}</div>
                </div>
              )
            else
              return(
                <div className="chat-box__chat">
                <div className="chat-box__chat-log">{element.message}</div>
              </div>
              )
          }
          })}
      </div>
      <form className="chat-box__input-wrapper" method="" onSubmit={(e)=>{e.preventDefault();}} onKeyDown={(e)=>{if(e.key === "Enter")e.preventDefault();}}>
        <div className="chat-box__image-uploader-wrapper">
          <input type="file" className="chat-box__image-input disabled" onChange={imageUploaded} ref={imageInputRef} multiple={true} accept='image/*'/>
          <button className="chat-box__image-button chat-box__button" onClick={imageUploadButtonHandler}><img src={addImageIcon} alt="addImageIcon" /></button>
        </div>
        <div className={classNames("chat-box__uploaded-file-box", {disabled: fileArrayIsEmpty})}>
        {uploadedImageFile.map((element, index) => {
          return(
            <div className="chat-box__uploaded-file-wrapper">
              <img src={URL.createObjectURL(element)} className={`chat-box__uploaded-file uploaded-file${index}`} onClick={()=>{removeUploadedImage(index);}}/>
              <img src={removeUploadedImageIcon} className="chat-box__remove-uploaded-file-icon"/>
            </div>
          )
        })}
        </div>
        <input className="chat-box__input" type="text" placeholder=" 메세지 보내기" onChange={changeMessage} onKeyDown={keyEventHandler} ref={inputRef} />
        <button className="chat-box__input-button chat-box__button" onClick={buttonHandler}><img src={sendIcon} alt="sendIcon" /></button>
      </form>
    </div>
  );
}

  export default ChatBox;