import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/post.js'
import commentRoutes from './routes/comment.js'
import logger,{morganMiddleware} from './logger/index.js'
import cookieParser from 'cookie-parser'
import {connectDB} from './utils/db.utils.js'
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

connectDB();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morganMiddleware);
app.use("/auth", authRoutes);
app.use("/post", postRoutes);
app.use("/comment", commentRoutes);

app.get("/", (req, res) => {
  res.send(`Server is running `);
});



app.listen(PORT, () => {
  logger.info(`Server is listening on port ${PORT}`);
  console.log(`Server is listening on port ${PORT}`);
});