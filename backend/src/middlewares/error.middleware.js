import config from '../config/config.js';
import logger from '../utils/logger.js';
import chatModel from '../models/chat.model.js';
import messageModel from '../models/message.model.js';
import apiKeyModel from '../models/apikey.model.js';

const errorMiddleware = (err, req, res, next) => {

    if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: err.message || 'Internal Server Error' })}\n\n`);
        res.end();
        return;
    }

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }

    if (err.code === 11000) {
        statusCode = 400;
        message = `Duplicate field: ${Object.keys(err.keyValue).join(', ')} already exists`;
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Your token has expired. Please log in again.';
    }

    logger.error(`${req.method} ${req.path} → ${statusCode} | ${message}`);

    res.status(statusCode).json({
        success: false,
        message,
        ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorMiddleware;