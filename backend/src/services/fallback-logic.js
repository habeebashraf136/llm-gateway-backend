import { generateResponse as mistralResponse, generateStream as mistralStream  } from "./mistral.ai.js";
import { generateResponse as groqResponse, generateStream as groqStream} from "./groq.ai.js";
import { generateResponse as QwenResponse, generateStream as QwenStream} from "./openrouter.ai.js";
import { generateResponse as deepseekResponse, generateStream as deepseekStream} from "./deepseek.ai.js";
import { generateChatTitle } from "./generatechat.title.js";
import logger from '../utils/logger.js';

const providers = {
    fast: mistralResponse,
    creative: QwenResponse,
    coding: deepseekResponse
};

const providersNames = {
    fast: 'Mistral',
    creative: 'Qwen',
    coding: 'DeepSeek',
    groq: 'Groq'
};

const streamProviders = {
    fast: mistralStream,
    creative: QwenStream,
    coding: deepseekStream,
    groq: groqStream
};

export const generateWithFallback = async (userMessage, type, isFirstMessage = false, chatHistory = []) => {
    const primaryProvider = providers[type];

    if (!primaryProvider) {
        throw new Error(`No provider found for type: ${type}`);
    }

    let response;
    let provider = type;
    let fallback = false;

    try {
        response = await primaryProvider(userMessage, chatHistory);
    } catch (err) {
        logger.warn(`Primary provider (${type}) failed. Switching to Groq fallback...`);

        try {
            response = await groqResponse(userMessage, chatHistory);
            provider = 'groq';
            fallback = true;
        } catch (fallbackError) {
            logger.warn('Groq fallback also failed.');
            throw new Error('All providers failed. Please try again later.');
        }
    }

    let title = null;
    if (isFirstMessage) {
        title = await generateChatTitle(userMessage);
    }

    return { 
        response: response.content, 
        usage: response.usage,
        provider,
        fallback,
        title, 
        providersNames
    };
};

export const generateStreamWithFallback = async (userMessage, type, isFirstMessage = false, chatHistory = []) => {
    const primaryStream = streamProviders[type];

    if (!primaryStream) {
        throw new Error(`No provider found for type: ${type}`);
    }

    let stream;
    let provider = type;
    let fallback = false;

    try{
        stream = await primaryStream(userMessage, chatHistory);
    }
    catch (err) {
        logger.warn(`Primary stream provider (${type}) failed. Switching to Groq fallback...`);

        try{
            stream = await groqStream(userMessage, chatHistory);
            provider = 'groq';
            fallback = true;
        }
        catch (fallbackError) {
            logger.warn('Groq fallback stream also failed.');
            throw new Error('All stream providers failed. Please try again later.');
        }
    }


    let title = null;
    if (isFirstMessage) {
        title = await generateChatTitle(userMessage);
    }
    
    return { 
        stream: stream.stream,
        getUsage: stream.getUsage,
        provider, 
        fallback, 
        title,  
        providersNames
    };

}

