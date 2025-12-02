import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import debateRoutes from "./routes/debateRoutes.js";
import cors from "cors";

dotenv.config();

connectDB();
const app = express();

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json({ limit: "50mb" })); // To parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // To parse form data in the req.body
app.use(cookieParser());

app.use(cors());
// Routes
app.use("/api/users", userRoutes);
app.use("/api/debates", debateRoutes);

app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));