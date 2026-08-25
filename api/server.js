import express from "express";
import deepseekRoute from "./api/deepseek.js";

const app = express();
app.use(express.json());

// Mount DeepSeek route
app.use("/api", deepseekRoute);

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
