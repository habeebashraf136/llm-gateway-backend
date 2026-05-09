import express from 'express';
import errorMiddleware from './middlewares/error.middleware.js';
import { apiLimiter } from './utils/rate.limit.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes.js';
import chatRouter from './routes/chat.routes.js';
import helmet from 'helmet';
import cors from 'cors';


const app = express();

app.use(helmet());
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(apiLimiter);
app.use(cookieParser());


app.get('/healthcheck', (req, res) => {
    res.send("server is running")
});


app.use('/api/auth', authRouter);
app.use('/api/chats', chatRouter);



app.use(errorMiddleware);


export default app;