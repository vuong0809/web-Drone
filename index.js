const express = require('express');
const app = express();
const http = require('http');

const serverHTTP = http.createServer(app);
// const serverHTTPS = https.createServer(app);

const { Server } = require("socket.io");
const io = new Server(serverHTTP);
const portHTTP = 3000;
const portHTTPS = 8443;

app.set("view engine","ejs");
app.set("views", "./views");
app.use(express.static('public'));

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var apiRouter = require('./routes/api');
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);

io.on('connection', (socket) => {
  console.log(socket.id,' connect');
  socket.on('message', msg => {
    io.emit("message", msg);
    // socket.broadcast.emit("message", msg);
    });
    socket.on("stream", img => {
      io.emit("stream", img);
    });
    socket.on("stream cam", img => {
      socket.broadcast.emit("stream cam", img);
    });    
    socket.on('disconnect', () => {
      console.log(socket.id,' disconnected');
    });
  });

  serverHTTP.listen(portHTTP, () => {
  console.log('listening on *:',portHTTP);
});

// serverHTTPS.listen(portHTTPS,()=>{
//   console.log('listening on *:', portHTTPS);
// });
