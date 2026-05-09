import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { searchInternet } from './internet.tool.js';
import config from '../config/config.js';

const QwenAi = new ChatOpenAI({
    apiKey: config.OPENROUTER_API_KEY,
    model: 'qwen/qwen3-235b-a22b-2507',
    configuration: {
        baseURL: 'https://openrouter.ai/api/v1'
    }
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

    const response = await QwenAi.invoke([
        new SystemMessage(`
            You are a creative and expressive assistant.
            Your job is to generate imaginative, engaging and original responses.
            Be descriptive, use vivid language and think outside the box.
            Avoid generic and boring answers.
            If given a creative task, fully commit to it with energy and originality.
            Keep responses well structured and easy to read.
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

    const stream = await QwenAi.stream([
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