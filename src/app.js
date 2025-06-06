// src/app.js
import express from "express";
import cors from "cors";
import { router } from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

app.get("/", (_, res) => {
    res.send("Hello API");
});

export default app;
