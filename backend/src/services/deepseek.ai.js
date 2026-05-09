import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { searchInternet } from './internet.tool.js';
import config from '../config/config.js';

const deepseekAi = new ChatOpenAI({
    apiKey: config.OPENROUTER_API_KEY,
    model: 'deepseek/deepseek-chat-v3-0324',
    configuration: {
        baseURL: 'https://openrouter.ai/api/v1'
    }
})

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
    
    const response = await deepseekAi.invoke([
        new SystemMessage(`
            You are an expert coding assistant.
            Write clean, efficient and well commented code.
            Always explain what the code does briefly after writing it.
            If you don't know the answer, say "I don't know" and stop.
            Prefer simple solutions over complex ones.
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

    const stream = await deepseekAi.stream([
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
