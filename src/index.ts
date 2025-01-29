import dotenv from "dotenv";
dotenv.config();
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers/resolvers.js";
import logger from "./utils/logger.js";
import express, { Application } from "express";
import { Server as SocketIOServer } from "socket.io"; // Correct import
import cors from "cors";

const app: any = express();

const corsOptions = {
  origin: "*", // Adjust this to allow only specific origins
  methods: "GET, POST",
  credentials: false, // if you need to include cookies or authentication tokens
};

app.use(cors(corsOptions)); // Apply CORS middleware

const server = new ApolloServer({ typeDefs, resolvers });
const startServer = async () => {
  await server.start();
  server.applyMiddleware({ app });

  const http = app.listen(3001, () =>
    logger.info("🚀 Server ready at http://localhost:3001" + server.graphqlPath)
  );
  const io = new SocketIOServer(http, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"], // Allowed methods for the WebSocket connection
      allowedHeaders: ["Content-Type"], // Optional: Add allowed headers
      credentials: true, // If you need to support cookies or authentication tokens
    },
  }); // Initialize socket.io server
  io.on("connection", (socket) => {
    logger.info("New socket connection established");

    // Emit a message to the client immediately after connection
    socket.emit("welcome", "Hello from the server!");

    // Listen for a custom event
    socket.on("clientMessage", (message) => {
      logger.info("Received message from client:", message);
      // Respond to the client with an acknowledgment
      socket.emit("serverMessage", "Message received by server!");
    });
  });
};

startServer();
