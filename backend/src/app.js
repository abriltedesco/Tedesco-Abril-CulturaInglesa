import express from 'express';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { NotFoundError } from './exceptions/AppError.js';
import { Messages } from './enums/Mensajes.js';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use('/api', routes);

app.use((req, res, next) => {
    next(new NotFoundError(Messages.ROUTE_NOT_FOUND));
});

app.use(errorHandler);

export default app;
