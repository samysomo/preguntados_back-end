import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import authRoutes from './routes/AuthRoutes.js';
import matchRoutes from './routes/MatchRoutes.js';
import userRoutes from './routes/UserRoutes.js';

dotenv.config();


const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

app.use(cors({
  origin: [process.env.ORIGIN],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/users', userRoutes);

const server = createServer(app);
const io = new Server(server, {
    cors: {
      origin: `http://localhost:${port}`,
      methods: ["GET", "POST"]
    }
  });


io.on('connection', (socket) => {

    console.log('a user connected');
    socket.on("message", (msg) => {
      io.emit("message", msg)
      console.log('message: ' + msg);
    })
    
  });


server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});

mongoose.connect(databaseURL)
  .then(() => console.log("DB Connection Successfull"))
  .catch(err => console.log(err.message));