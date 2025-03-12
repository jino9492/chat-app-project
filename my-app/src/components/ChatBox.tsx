/* eslint-disable jsx-a11y/alt-text */
import React, { useCallback, useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import "../styles/ChatBox.css";
import sendIcon from "../assets/send_message_icon.png";
import addImageIcon from "../assets/add_image_icon.png";
import removeUploadedImageIcon from "../assets/remove_uploaded_file_icon.png"
import classNames from "classnames";
import SocketProps from "../interfaces/interfaces";

interface ChatData{
  name: string;
  message: string;
  date: string | null;
  timeData: number | null;
  roomName: string | null;
}

const socket = io("http://localhost:8000/");
socket.emit("init", "anoymous");

const ChatBox: React.FC<SocketProps> = (props) => {

  const inputRef = useRef<HTMLInputElement>(document.createElement("input"));
  const chatBoxRef = useRef<HTMLDivElement>(document.createElement("div"));
  const imageInputRef = useRef<HTMLInputElement>(document.createElement("input"));

  const [chatArr, setChatArr] = useState<any[]>([]);
  const [chat, setChat] = useState<ChatData>(
    {
      name: props.userName,
      message: "",
      date: null,
      timeData: null,
      roomName: null
    }
  );
  const [uploadedImageFile, setUploadedImageFile] = useState<File[]>([]);

  const [fileArrayIsEmpty, setFileArrayIsEmpty] = useState<boolean>(true);

  useEffect(() => {
    receiveMessage();
    receiveImageFile();
  }, []);

  const receiveMessage = () => {
    socket.on("receive message", (message) => {
      setChatArr((chatArr) => chatArr.concat(message));
    });
  }

  const receiveImageFile = () => {
    socket.on("recieve image file", (data) => {
      console.log("123");
      setChatArr((chatArr) => chatArr.concat(
        [
          {
            name: props.userName,
            message: data.file,
            date:data.date,
            timeData:data.timeData,
            roomName: props.curRoom
          }
        ]
      ));
    });
  }

  useEffect(() => {
    socket.emit("enter room", props.curRoom)
  }, [props.curRoom])

  // 스크롤바 아래로
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

  const getImageMimeType = (extension:string):string => {
    const mimeTypes = {
      jpg: "jpeg",
      jpeg: "jpeg",
      png: "png",
      gif: "gif",
      webp: "webp",
      svg: "svg+xml",
    } as const;
    return mimeTypes[extension as keyof typeof mimeTypes] || "jpeg"; // 기본값은 jpeg
  }

  const getArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        resolve(arrayBuffer);
      };

      reader.onerror = () => reject("파일을 읽는 중 오류 발생");

      reader.readAsArrayBuffer(file); // ArrayBuffer로 파일을 읽음
    });
  }

  const handleFileUpload = async (file: File) => {
    try {
      const arrayBuffer = await getArrayBuffer(file);
      return arrayBuffer; // base64 대신 ArrayBuffer 반환
    } catch (error) {
      console.error(error); // 오류가 발생하면 출력됩니다.
    }
  };

  const textClear = () => {
    inputRef.current.value = "";
    setChat(
      {
        name: props.userName,
        message: "",
        date: null,
        timeData: null,
        roomName: props.curRoom
      }
    )
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

    if (chat.message !== ""){
      socket.emit("send message",
        {
          name: props.userName,
          message: chat.message,
          date: curDateFormatted,
          timeData: curDate.getTime(),
          roomName: props.curRoom
        });
      textClear();
    }

    if (!fileArrayIsEmpty){
      uploadImage(curDateFormatted, curDate);
    }

    console.log(chatArr);
  };

  const uploadImage = (curDateFormatted: string, curDate: Date) => {
    uploadedImageFile.forEach(async (el) => {
      const arrayBuffer = await handleFileUpload(el);
      console.log("Sending image file: ", arrayBuffer); // 로그 확인
      socket.emit("send image file", {
        name: props.userName,
        file: arrayBuffer, // ArrayBuffer를 서버로 전송
        type: el.type.split('/')[1],
        date: curDateFormatted,
        timeData: curDate.getTime(),
        roomName: props.curRoom
      });
    });

    setUploadedImageFile([]); // 업로드 후 파일 초기화
  }

  const imageUploadButtonHandler = () => {
    imageInputRef.current.click();
  }

  const imageUploaded = (e:React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files != null){
      for(let i = 0; i < e.target.files.length; i++){
        let file = [e.target.files![i]];

        setUploadedImageFile((imageFile) => imageFile.concat(file));
        e.target.value = "";
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
    setChat(
      {
        name: props.userName,
        message: e.target.value,
        date: null,
        timeData: null,
        roomName: props.curRoom
      }
    );
  }, [chat]);

  return (
    <div className="chat-box__container">
      <div className="chat-box__window" ref={chatBoxRef}>
      {chatArr.map((element, index, array) => {
          let preIdx = 0;
          if (index > 0) preIdx = index - 1;
          if (typeof element.message === 'string'){
            // element.message가 문자열일 때 (텍스트 메시지인 경우)
            if (!element.message.startsWith("http://localhost:8000/uploads/")) {
              if (!checkMessageInterval(array[index].timeData - array[preIdx].timeData) || (preIdx <= 0 && index <= 0)) {
                return (
                  <div className="chat-box__chat" key={index}>
                    <div className="chat-box__chatter-name">
                      {element.name}
                      <div className="chat-box__chat-time">{element.date}</div>
                    </div>
                    <div className="chat-box__chat-log">{element.message}</div>
                  </div>
                );
              } else {
                return (
                  <div className="chat-box__chat" key={index}>
                    <div className="chat-box__chat-log">{element.message}</div>
                  </div>
                );
              }
            }
  
            // element.message가 이미지 URL일 때 (이미지 메시지인 경우)
            else {
              if (!checkMessageInterval(array[index].timeData - array[preIdx].timeData) || (preIdx <= 0 && index <= 0)) {
                return (
                  <div className="chat-box__chat" key={index}>
                    <div className="chat-box__chatter-name">
                      {element.name}
                      <div className="chat-box__chat-time">{element.date}</div>
                    </div>
                    <img className="chat-box__chat-image" src={element.message} alt="Uploaded" />
                  </div>
                );
              } else {
                return (
                  <div className="chat-box__chat" key={index}>
                    <img className="chat-box__chat-image" src={element.message} alt="Uploaded" />
                  </div>
                );
              }
            }
          }

          return null; // 텍스트와 이미지가 아닌 경우 (예외 처리)
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
              <img src={(URL.createObjectURL(element))} className={`chat-box__uploaded-file uploaded-file${index}`} onClick={()=>{removeUploadedImage(index);}}/>
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