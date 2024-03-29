const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("connection");
  socket.on("init", (payload) => {
    console.log(payload);
  });

  socket.on("send message", (item) => {
    console.log(item.name + ": " + item.message + " / " + item.date + " / " + item.timeData);
    io.emit("receive message", {name : item.name, message: item.message, date: item.date, timeData: item.timeData});
  })

  socket.on("send image-file", (data) => {
    io.emit("recieve image-file", { name: data.name, file: data.file, date: data.date, timeData: data.timeData });
  });
});

httpServer.listen(8000);