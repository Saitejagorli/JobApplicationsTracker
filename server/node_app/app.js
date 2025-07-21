import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { connection } from "./config/db.js";
import { applicationRoutes } from "./routes/applicationRoutes.js";

const URL = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@mycluster.hn7nqnf.mongodb.net/?retryWrites=true&w=majority&appName=myCluster`;

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connection(URL);

app.get("/", (req, res) => {
  res.send("hello from server");
});
app.use("/applications", applicationRoutes);

app.listen(process.env.PORT || 8000, "0.0.0.0", () => {
  console.log(`server running on port ${process.env.PORT}`);
});
