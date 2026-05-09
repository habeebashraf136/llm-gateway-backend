import {body, validationResult} from 'express-validator';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}


export const registerValidator = [
    body('username')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Username is required'),
    body('email')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Email is required'),
    body('email')
    .isEmail()
    .withMessage('Email is not a valid email address'),
    body('password')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/[0-9]/)
    .withMessage('Password must contain number'),

    validate
]

export const loginValidator = [
    body('email')
    .trim()
    .not()
    .isEmpty()
    .isEmail()
    .withMessage('Email is not a valid email address'),
    body('password')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/[0-9]/)
    .withMessage('Password must contain number'),

    validate
]