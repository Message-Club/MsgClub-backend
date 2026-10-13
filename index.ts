import { corsMiddleware, bigintSerializer } from "./utils/helpers.js";
import { initializeSocket } from "./configs/socket.config.js";
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import http from "http";

import routes from "./routes/routes.js";


dotenv.config();

const app = express();

// Middleware
app.use(corsMiddleware);

app.use(express.json());

app.use(bigintSerializer);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(morgan("dev"));

// Routes
app.use("/api", routes);

// HTTP Server
const server = http.createServer(app);

// Socket.IO
initializeSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );
});