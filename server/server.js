const SERVER_PORT = 8000;
const CLIENT_PORT = 3000;
const APP_URL = `http://localhost:${SERVER_PORT}`;

const express = require('express');
const app = express();
const mysql = require('mysql2');
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

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // MySQL 사용자 이름
  password: 'wjdwlsdhmysql112',  // MySQL 비밀번호
  database: 'db',  // 사용할 데이터베이스 이름
});

db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
    return;
  }
  console.log('MySQL 연결 성공');
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

    const query = "INSERT INTO messages (name, message, date, time, room) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [item.name, item.message, item.date, item.timeData, item.roomName], (err, result) => {
      if (err) {
        console.error("채팅 메시지 저장 실패:", err);
      } else {
        console.log("채팅 메시지 저장 성공:", result.insertId);
      }
    });

    socket.emit("receive message", item);
    socket.to(item.roomName).emit("receive message", item);
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
        const imageURL = `${APP_URL}/uploads/${fileName}`;
        console.log('이미지 저장 완료:', imageURL);
        const query = "INSERT INTO images (name, file_url, date, time, room) VALUES (?, ?, ?, ?, ?)";
        db.query(query, [data.name, imageURL, data.date, data.timeData, data.roomName], (err, result) => {
          if (err) {
            console.error("이미지 데이터 저장 실패:", err);
          } else {
            console.log("이미지 데이터 저장 성공:", result.insertId);
          }
        });

        socket.emit("recieve image file", {
          name: data.name,
          file: imageURL,
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