import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import debateRoutes from "./routes/debateRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import motionRoutes from "./routes/motionRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import roundRoutes from "./routes/roundRoutes.js";
import debateRoomRoutes from "./routes/debateRoomRoutes.js";
import speechRoutes from "./routes/speechRoutes.js";
import ballotRoutes from "./routes/ballotRoutes.js";
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
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/motions", motionRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/rounds", roundRoutes);
app.use("/api/debate-rooms", debateRoomRoutes);
app.use("/api/speeches", speechRoutes);
app.use("/api/ballots", ballotRoutes);

app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));