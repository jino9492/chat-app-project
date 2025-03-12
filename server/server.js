const SERVER_PORT = 8000;
const CLIENT_PORT = 3000;
const APP_URL = `http://localhost:${SERVER_PORT}`;

const express = require('express');
const app = express();
const httpServer = require("http").createServer(app);
const fs = require('fs');
const path = require('path');

const io = require("socket.io")(httpServer, {
  cors: {
    origin: `http://localhost:${CLIENT_PORT}`,
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8,
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 서버-클라이언트 연결
io.on("connection", (socket) => {
  console.log("connection");
  socket.on("init", (payload) => {
    console.log(payload);
  });

  // 채팅방 입장
  socket.on("enter room", (roomName) => {
    socket.join(roomName);
    socket.emit(socket.rooms);
    console.log(socket.rooms);
  });

  // 텍스트 통신
  socket.on("send message", (item) => {
    console.log(item.name + ": " + item.message + " / " + item.date + " / " + item.timeData + " / " + item.roomName);
    socket.emit("receive message", {
      name : item.name,
      message: item.message,
      date: item.date,
      timeData: item.timeData,
      roomName:item.roomName
    });
    socket.to(item.roomName).emit("receive message", {
      name : item.name,
      message: item.message,
      date: item.date,
      timeData: item.timeData,
      roomName:item.roomName
    });
  })

  // 이미지 통신
  socket.on("send image file", (data) => {
    const buffer = Buffer.from(data.file); // ArrayBuffer를 Node.js의 Buffer로 변환
    const fileName = `image_${Date.now()}.${data.type}`;
    const filePath = path.join(__dirname, 'uploads', fileName);

    fs.writeFile(filePath, buffer, (err)=>{
      if(err){
        console.error('파일 저장 실패:', err);
        socket.emit("error", "파일 저장 실패")
      }
      else{
        console.log('이미지 저장 완료:', `${APP_URL}/uploads/${fileName}`);
        socket.emit("recieve image file", {
          name: data.name,
          file: `${APP_URL}/uploads/${fileName}`,
          date: data.date,
          type: data.type,
          timeData: data.timeData,
          roomName:data.roomName
        });
      }
    })
    //socket.to(item.roomName).emit("recieve image-file", { name: data.name, file: data.file, date: data.date, timeData: data.timeData, roomName:item.roomName});
  });
});

httpServer.listen(SERVER_PORT);