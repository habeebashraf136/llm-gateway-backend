import {body, validationResult} from 'express-validator';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

export const chatValidator = [
    body('type')
    .trim()
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['fast', 'creative', 'coding'])
    .withMessage('Type must be fast, creative, or coding'),
    body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required'),
    body('chatId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Chat ID cannot be empty'),

    validate,
    
]