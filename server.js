// Dependencies
import express, {json} from 'express';
import cors from 'cors';
import cookieSession from 'cookie-session';
import userRouter from './controllers/userRoutes.js';
import { config } from 'dotenv';

// Application
const app = express();

// Middleware/Config
config();

app.use(cookieSession({
    name: 'session',
    sameSite: 'strict',
    keys: [process.env.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours in ms
}));
app.use(cors({
    origin: `http://localhost:3000`,
    credentials: true
}));
app.use(json());

// Routes
app.use('/auth', userRouter);

app.use('*', (_req, res) => {
    res.status(404).send("Sorry! The page requested was not fount.");
});

export default app;