const express=require("express");
const dotenv=require("dotenv");
const mongoose = require("mongoose");
const cors=require("cors");
const http=require("http");
const socketIo = require("./socket");
const socketio=require("socket.io");
const userRouter=require("./routes/userRoutes");
const groupRouter = require("./routes/groupRoutes");
const messageRouter = require("./routes/messageRoute");
dotenv.config();

//for socketIo
const app=express();
const server=http.createServer(app);
const io=socketio(server,{
    cors:{
        origin:['https://chatapp-n1dh.onrender.com','http://localhost:5173'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        optionsSuccessStatus: 204
      
    }
});
//middlewares
app.use(cors());
app.use(express.json());

//connect to db

mongoose.connect(process.env.MONGO_URL).then(()=>console.log("Connected to DB")).
catch((err)=>console.log("Mongo db failed",err));

//initialise

socketIo(io);

//our routes

app.use("/api/users",userRouter);
app.use("/api/groups",groupRouter);
app.use("/api/messages",messageRouter);

//server
const port=process.env.port||5000;
server.listen(port,console.log(`Server is running on port ${port}`));
