import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from 'http';

dotenv.config();

import routes from './routes';

import errorMiddleware from './middlewares/error.middleware';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json()); 
app.use(morgan('dev')); 

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 3001;
let server: Server;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`Auth service running on port ${PORT}`);
  });
} else {
  server = {} as Server;
}


export default app;
export { server };
