import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import conceptRoutes from './routes/conceptRoutes.js';
import essayRoutes from './routes/essayRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import technologyRoutes from './routes/technologyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/essays', essayRoutes);
app.use('/api/concepts', conceptRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/technology', technologyRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
