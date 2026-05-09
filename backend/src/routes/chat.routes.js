import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { apikeyMiddleware } from '../middlewares/apikey.middleware.js';
import { apiLimiter } from '../utils/rate.limit.js';
import { sendMessage, sendMessageStream, getchats, getMessages, deleteChat, getUsage } from '../controllers/chat.controller.js';
import { chatValidator } from '../validators/chat.validator.js';


const chatRouter = Router();

// @Router post /api/chat/message
// @Description Send a message to the chatbot
// @Access Private
chatRouter.post('/message', isAuthenticated, apiLimiter, apikeyMiddleware, chatValidator, sendMessage);

// Router post /api/chat/message/stream
// @Description Send a message to the chatbot and receive a stream of responses
// @Access Private
chatRouter.post('/message/stream', isAuthenticated, apiLimiter, apikeyMiddleware, chatValidator, sendMessageStream);

// @Router post /api/chat/getChat
// @Description Get the chat history of a chat
// @Access Private
chatRouter.get('/getChat', isAuthenticated, apiLimiter, getchats);

// @Router post /api/chat/getMessages
// @Description Get the messages of a chat
// @Access Private
chatRouter.get('/getMessages/:chatId', isAuthenticated, apiLimiter, getMessages);

// @Router post /api/chat/deleteChat
// @Description Delete a chat and its messages
// @Access Private
chatRouter.delete('/deleteChat/:chatId', isAuthenticated, apiLimiter, deleteChat);

// Router post /api/chat/usage
// @Description Get the usage of the user tokens
// @Access Private
chatRouter.get('/tokenusage', isAuthenticated, apiLimiter, apikeyMiddleware, getUsage);


export default chatRouter;

