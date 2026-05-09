import { ChatMistralAI } from '@langchain/mistralai';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const mistralAi = new ChatMistralAI({
    apiKey: config.MISTRAL_API_KEY,
    model: 'mistral-small-latest'
});

const groqAi = new ChatGroq({
    apiKey: config.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile'
});

const titleSystemPrompt = `
    Generate a short, concise title for the chat based on the user's message.
    Max 5-6 words. No punctuation. No quotes. Just the title.
`;

export const generateChatTitle = async (userMessage) => {
    try {
        const response = await mistralAi.invoke([
            new SystemMessage(titleSystemPrompt),
            new HumanMessage(userMessage)
        ]);
        return response.content;
    } catch (err) {
        logger.warn('Mistral title generation failed. Switching to Groq...');
        try {
            const response = await groqAi.invoke([
                new SystemMessage(titleSystemPrompt),
                new HumanMessage(userMessage)
            ]);
            return response.content;
        } catch (fallbackError) {
            return 'New Chat';
        }
    }
};