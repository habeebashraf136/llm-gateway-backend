import { tavily } from '@tavily/core';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const client = tavily({
    apiKey: config.TAVILY_API_KEY,
});


export const searchInternet = async (query) => {
    try{
        const result = await client.search(query,{
            maxResults: 5,
            days: 7,
        })
   
        return result.results
    } catch (error) {
        logger.error('Error searching internet:', error);
        return null; 
    }
}