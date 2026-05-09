import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redis from '../config/cache.js';
import config from '../config/config.js';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
    }),
    message: {
        success: false,
        message: 'Too many requests, try again after 15 minutes',
    }
});

export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    limit: config.NODE_ENV === 'production' ? 5 : 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
    }),
    message: {
        success: false,
        message: 'Too many attempts, try again after an hour',
    }
});