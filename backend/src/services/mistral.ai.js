import { ChatMistralAI } from '@langchain/mistralai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { searchInternet } from './internet.tool.js';
import config from '../config/config.js';


const mistralAi = new ChatMistralAI({
    apiKey: config.MISTRAL_API_KEY,
    model: 'mistral-small-latest'
});

export const generateResponse = async (userMessage, chatHistory = []) => {

    
    const searchResults = await searchInternet(userMessage);

    let searchContext = '';
    if (Array.isArray(searchResults) && searchResults.length > 0) {
        searchContext = `
            Here is some relevant real-time information from the web:
            ${searchResults.map((r, i) => `${i + 1}. ${r.content}`).join('\n')}
            Use this information to answer if relevant.
        `;
    }

    const history = chatHistory.map(msg =>
        msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    );

    const response = await mistralAi.invoke([
        new SystemMessage(`
            You are a fast and concise assistant.
            Your job is to give short, direct and accurate answers.
            Do not over-explain. Do not add unnecessary information.
            Always respond in plain simple language.
            ${searchContext}
        `),
        ...history,
        new HumanMessage(userMessage)
    ]);
    
    const usage = {
        prompt_tokens: response.usage_metadata.input_tokens,
        completion_tokens: response.usage_metadata.output_tokens,
        total_tokens: response.usage_metadata.total_tokens
    };

    return { content: response.content, usage };
};


export const generateStream = async (userMessage, chatHistory = []) => {

    const searchResults = await searchInternet(userMessage); 

    let searchContext = '';
    if (Array.isArray(searchResults) && searchResults.length > 0) {
        searchContext = `
            Here is some relevant real-time information from the web:
            ${searchResults.map((r, i) => `${i + 1}. ${r.content}`).join('\n')}
            Use this information to answer if relevant.
        `;
    }

    const history = chatHistory.map(msg =>
        msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    );

    const stream = await mistralAi.stream([
        new SystemMessage(`
            You are a fast and concise assistant.
            Your job is to give short, direct and accurate answers.
            Do not over-explain. Do not add unnecessary information.
            Always respond in plain simple language.
            ${searchContext}
        `),
        ...history,
        new HumanMessage(userMessage)
    ]);

    let usage = null;

    async function* streamGenerator() {
        for await (const chunk of stream) {
            if (chunk.usage_metadata) {
                usage = {
                    prompt_tokens: chunk.usage_metadata.input_tokens,
                    completion_tokens: chunk.usage_metadata.output_tokens,
                    total_tokens: chunk.usage_metadata.total_tokens
                };
            }
                yield chunk.content;
        }
    }

    return {
        stream: streamGenerator(),
        getUsage: () => usage 
    }
};