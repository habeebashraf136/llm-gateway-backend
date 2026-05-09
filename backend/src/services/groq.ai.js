import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { searchInternet } from './internet.tool.js';
import config from '../config/config.js';


const groqAi = new ChatGroq({
    apiKey: config.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
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

    const response = await groqAi.invoke([
        new SystemMessage(`
            You are a versatile assistant that handles three types of tasks:

            1. Fast tasks — Give short, direct and accurate answers. No over-explaining.
            2. Creative tasks — Be expressive, imaginative and original in your responses.
            3. Coding tasks — Write clean, efficient and well commented code. Briefly explain what the code does.

            Always match your response style to the type of task given.
            If you don't know something, say "I don't know" and stop.
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

    const stream = await groqAi.stream([
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
            // Check both locations
            if (chunk.usage_metadata?.input_tokens) {
                usage = {
                    prompt_tokens: chunk.usage_metadata.input_tokens,
                    completion_tokens: chunk.usage_metadata.output_tokens,
                    total_tokens: chunk.usage_metadata.total_tokens
                };
            } else if (chunk.response_metadata?.usage) {
                usage = {
                    prompt_tokens: chunk.response_metadata.usage.prompt_tokens,
                    completion_tokens: chunk.response_metadata.usage.completion_tokens,
                    total_tokens: chunk.response_metadata.usage.total_tokens
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



