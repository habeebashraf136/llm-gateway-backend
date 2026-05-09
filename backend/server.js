import dotenv from 'dotenv';
dotenv.config();
import app from './src/app.js'
import connectDB from './src/config/database.js';
import logger from './src/utils/logger.js';


connectDB()

const Port = process.env.PORT || 4000;



app.listen(Port, () => {
    logger.info(`server is running on port ${Port}`)
});