import express from "express";
import cors from "cors";
import userRouter from './routes/user.routes.js'
import cookieParser from "cookie-parser";
import chatRouter from './routes/chat.routes.js'
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("/public"));
app.use(cookieParser());

app.use("/chatapp/users", userRouter);
app.use("/chatapp/chats", chatRouter);

export { app };