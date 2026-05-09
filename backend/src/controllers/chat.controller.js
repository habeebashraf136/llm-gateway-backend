import asyncHandler from "../utils/async.handler.js"
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import { generateWithFallback, generateStreamWithFallback } from "../services/fallback-logic.js";
import apiKeyModel from "../models/apikey.model.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";

const providerModelMap = {
    fast: 'mistral-small-latest',
    creative: 'qwen/qwen3-235b-a22b-2507',
    coding: 'deepseek/deepseek-chat-v3-0324',
    groq: 'llama-3.3-70b-versatile'
};

export const sendMessage = asyncHandler(async (req, res, next) => {
    const { type, message, chatId } = req.body;
    const userId = req.user.userid;
    const apikeyid = req.apiKey._id;

    if (!type || !message) {
        return res.status(400).json({ success: false, message: 'Type and message are required' });
    }

    if (!['fast', 'creative', 'coding'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Type must be fast, creative, or coding' });
    }

    const isFirstMessage = !chatId;
    let chat;
    let chatHistory = [];

    if (!isFirstMessage) {
        chat = await chatModel.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }
        if (chat.user.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'You do not have permission to access this chat' });
        }

        chatHistory = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });
    }

    const { response, usage, provider, fallback, title, providersNames } = await generateWithFallback(
        message,
        type,
        isFirstMessage,
        chatHistory
    );

    const usageToken = usage.total_tokens;
    const modelName = providerModelMap[provider];
    const providerName = providersNames[provider];

    const session = await mongoose.startSession();
    session.startTransaction();


    try {
        if (isFirstMessage) {
            const newChat = await chatModel.create([{
                user: userId,
                apikeyid,
                title: title || 'New Chat',
                type,
                model: modelName,
                messageCount: 0,
            }], { session });
            
            chat = newChat[0]; 
        }

        await messageModel.insertMany([
            {
                chat: chat._id,
                user: userId,
                content: message,
                role: 'user',
                type,
                tokenUsed: 0,
                provider: providerName,
                isFallback: fallback,
                model: modelName,
                isStreamed: false
            },
            {
                chat: chat._id,
                user: userId,
                content: response,
                role: 'assistant',
                type,
                tokenUsed: usageToken,
                provider: providerName,
                isFallback: fallback,
                model: modelName,   
                isStreamed: false
            }
        ], { session });

        await chatModel.findByIdAndUpdate(chat._id, {
            $inc: { messageCount: 2 }
        }, { session });

        await apiKeyModel.findByIdAndUpdate(apikeyid, {
            $inc: { reqCount: 1, token: -usageToken }
        }, { session });

        await session.commitTransaction();

    } catch (error) {
        await session.abortTransaction();
        throw error; 
    } finally {
        session.endSession();
    }

    return res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        chatId: chat._id,
        title: isFirstMessage ? chat.title : undefined,
        response,
        type,
        tokenUsed: usageToken,
        provider: providerName,
        model: modelName,
        isFallback: fallback
    });
});

export const sendMessageStream = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { type, message, chatId } = req.body;
        const userId = req.user.userid;
        const apikeyid = req.apiKey._id;

        if (!type || !message) {
            return res.status(400).json({ success: false, message: 'Type and message are required' });
        }

        if (!['fast', 'creative', 'coding'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type must be fast, creative, or coding' });
        }

        const isFirstMessage = !chatId;
        let chat;
        let chatHistory = [];

        if (!isFirstMessage) {
            chat = await chatModel.findById(chatId).session(session);
            if (!chat) {
                return res.status(404).json({ success: false, message: 'Chat not found' });
            }
            if (chat.user.toString() !== userId.toString()) {
                return res.status(403).json({ success: false, message: 'You do not have permission to access this chat' });
            }

            chatHistory = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 }).session(session);
        }

        const { stream, getUsage, provider, providersNames, fallback, title } = await generateStreamWithFallback(
            message,
            type,
            isFirstMessage,
            chatHistory
        );

        const modelName = providerModelMap[provider];
        const providerName = providersNames[provider];

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        if (isFirstMessage) {
            const newChat = await chatModel.create([{
                user: userId,
                apikeyid,
                title: title || 'New Chat',
                type,
                model: modelName,
                messageCount: 0,
            }], { session });
            
            chat = newChat[0];

            res.write(`data: ${JSON.stringify({ message: 'Chat created', chatId: chat._id, title: chat.title })}\n\n`);
        }

        await messageModel.create([{
            chat: chat._id,
            user: userId,
            content: message,
            role: 'user',
            type,
            tokenUsed: 0,
            provider: providerName,
            isFallback: fallback,
            model: modelName,
            isStreamed: true
        }], { session });

        let fullResponse = '';
        for await (const chunk of stream) {
            const chunkText = chunk;  
            if (chunkText) {
                fullResponse += chunkText;
                res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
            }
        }

        const usage = getUsage();
        const usageToken = usage?.total_tokens || 0;

        if (!res.destroyed) {
            res.write(`data: ${JSON.stringify({
                message: 'Stream ended',
                chatId: chat._id, 
                type,
                provider: providerName,
                model: modelName, 
                tokenUsed: usageToken, 
                isFallback: fallback,
                isStreamed: true
            })}\n\n`);
            
            res.end(); 
        }
        
        await messageModel.create([{
            chat: chat._id,
            user: userId,
            content: fullResponse,
            role: 'assistant',
            type,
            tokenUsed: usageToken,
            provider: providerName,
            isFallback: fallback,
            model: modelName,
            isStreamed: true
        }], { session }),

        await chatModel.findByIdAndUpdate(chat._id, {
            $inc: { messageCount: 2 }
        }, { session }),

        await apiKeyModel.findByIdAndUpdate(apikeyid, {
            $inc: { 
                reqCount: 1,
                token: -usageToken 
            }
        }, { session })

        await session.commitTransaction();

    } catch (error) {
        await session.abortTransaction();
        logger.error('Error in sendMessageStream:', error);
        
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'An error occurred while processing the stream' });
        } else if (!res.destroyed) {
            res.write(`data: ${JSON.stringify({ message: 'An error occurred while processing the stream' })}\n\n`);
            res.end();
        }
    } finally {
        session.endSession();
    }
});

export const getchats = asyncHandler(async (req, res, next) => {
    const userId = req.user.userid;

    const chats = await chatModel.find({ user: userId }).sort({ updatedAt: -1 });

    if(!chats) {
        return res.status(404).json({
            success: false,
            message: 'No chats found'
        });
    }

    return res.status(200).json({
        success: true,
        chats
    });
});

export const getMessages = asyncHandler(async (req, res, next) => {
    const userId = req.user.userid;
    const { chatId } = req.params;

    const chat = await chatModel.findById(chatId);

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }

    if (chat.user.toString() !== userId.toString()) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this chat'
        });
    }

    const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });

    return res.status(200).json({
        success: true,
        messages
    });


});

export const deleteChat = asyncHandler(async (req, res, next) => {
    const userId = req.user.userid;
    const { chatId } = req.params;

    const chat = await chatModel.findById(chatId);

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }

    if (chat.user.toString() !== userId.toString()) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to delete this chat'
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await chatModel.findByIdAndDelete(chatId, { session });
        await messageModel.deleteMany({ chat: chatId }, { session });

        await session.commitTransaction();

    } catch (error) {
        await session.abortTransaction();
        throw error; 
    } finally {
        session.endSession();
    }

    return res.status(200).json({
        success: true,
        message: 'Chat deleted successfully'
    });  
});

export const getUsage = asyncHandler(async (req, res, next) => {

    const userId = req.user.userid;
    const apikeyid = req.apiKey._id;

    const apikey = await apiKeyModel.findById(apikeyid);

    const providerUsage = await messageModel.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                role: 'assistant',
                tokenUsed: { $gt: 0 }
            }
        },
        {
            $group: {
                _id: '$provider',
                totalTokens: { $sum: '$tokenUsed' },
                requestCount: { $sum: 1 }
            }
        }
    ]);

    const totalBurnedTokens = providerUsage.reduce((sum, provider) => sum + provider.totalTokens, 0);

    const byProvider = {}
    providerUsage.forEach(provider => {
        byProvider[provider._id] = {
            totalTokens: provider.totalTokens,
            requestCount: provider.requestCount
        }
    });

    return res.status(200).json({
        success: true,
        remainingtoken: Math.max(0, apikey.token),
        totalTokensBurned: totalBurnedTokens,
        totalRequests: apikey.reqCount,
        byProvider
    });
});

