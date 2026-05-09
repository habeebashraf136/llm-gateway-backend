import mongoose from 'mongoose';
import config from './config.js';
import logger from '../utils/logger.js'


const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGODB);
        logger.info('✓ MongoDB connected');
    } catch (err) {
        logger.error('✗ MongoDB connection failed:', err.message);
        process.exit(1);
    }
};


export default connectDB