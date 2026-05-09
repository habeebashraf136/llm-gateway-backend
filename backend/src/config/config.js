import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();


if(!process.env.MONGODB_URI){
    const err = new Error('MONGO_URI is not defined in environment variables');
    logger.error(err);
    process.exit(1);
}

if(!process.env.REDIS_HOST){
    const err = new Error('REDIS_HOST is not defined in environment variables');
    logger.error(err);
    process.exit(1);
}

if(!process.env.REDIS_PORT){
    const err = new Error('REDIS_PORT is not defined in environment variables');
    logger.error(err);
    process.exit(1);
}

if(!process.env.REDIS_PASSWORD){
    const err = new Error('REDIS_PASSWORD is not defined in environment variables');
    logger.error(err);
    process.exit(1);
}

if(!process.env.ACCESS_TOKEN_SECRET){
    const err = new Error('ACCESS_TOKEN_SECRET is not defined in environment variables');
    logger.error(err);
    process.exit(1);
}

if(!process.env.REFRESH_TOKEN_SECRET){
    const err = new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');
    logger.error(err);
    process.exit(1);
}

if(!process.env.NODE_ENV){
    process.env.NODE_ENV = 'development';
}

if(!process.env.MISTRAL_API_KEY){
    const err = new Error('MISTRAL_API_KEY is not defined in environment variables');
    logger.error(err);
    process.exit(1);
}

if(!process.env.GROQ_API_KEY){
    const err = new Error('GROQ_API_KEY is not defined in environment variables');
    logger.error(err);
    process.exit(1);
}

if(!process.env.OPENROUTER_API_KEY){
    const err = new Error('OPENROUTER_API_KEY is not defined in environment variables');
    logger.error(err);
    process.exit(1);
}

if(!process.env.TAVILY_API_KEY){
    const err = new Error('TAVILY_API_KEY is not defined in environment variables');
    logger.error(err);
    process.exit(1);
}

// logger.warn(process.env.TAVILY_API_KEY)


const config = {
    MONGODB:process.env.MONGODB_URI,
    REDIS_HOST:process.env.REDIS_HOST,
    REDIS_PORT:process.env.REDIS_PORT,
    REDIS_PASSWORD:process.env.REDIS_PASSWORD,
    ACCESS_TOKEN_SECRET:process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET:process.env.REFRESH_TOKEN_SECRET,
    NODE_ENV:process.env.NODE_ENV,
    MISTRAL_API_KEY:process.env.MISTRAL_API_KEY,
    GROQ_API_KEY:process.env.GROQ_API_KEY,
    OPENROUTER_API_KEY:process.env.OPENROUTER_API_KEY,
    TAVILY_API_KEY:process.env.TAVILY_API_KEY
}

export default config;