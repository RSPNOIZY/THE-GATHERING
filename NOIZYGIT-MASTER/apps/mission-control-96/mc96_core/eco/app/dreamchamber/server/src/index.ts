import "dotenv/config";
import express from "express";
import cors from "cors";
import statusRouter from "./routes/status.js";
import commandRouter from "./routes/command.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/status", statusRouter);
app.use("/api/command", commandRouter);

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`DreamChamber server listening on http://localhost:${port}`);
});
