import 'dotenv/config';
import express, { Application } from "express";
import { createServer } from "http";
import middleware from "./middleware/error";
import fileupload from "express-fileupload";
import cookieParser from "cookie-parser";
import cors from "cors";
import * as routes from "./routes/index";
import { setupSocketServer } from "./config/socketServer";

const app: Application = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileupload());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Load Routes
Object.values(routes).forEach((route: any) => {
  app.use("/api/v1", route);
});

// Middleware for handling errors
app.use(middleware);

setupSocketServer(server);

export { app, server };
