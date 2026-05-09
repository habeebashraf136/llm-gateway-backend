import apikeyModel from '../models/apikey.model.js';
import logger from '../utils/logger.js';

export const apikeyMiddleware = async (req, res, next) => {
    try {
        const providedApikey = req.headers.apikey;

        if (!providedApikey) {
            return res.status(401).json({
                success: false,
                message: 'API key not provided'
            });
        }

        const userid = req.user.userid;

        const apikeys = await apikeyModel.find({ user: userid });

        if (!apikeys || apikeys.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'API key not found'
            });
        }

        let matchedKey = null;
        for (let key of apikeys) {
            const isMatch = await key.compareApikey(providedApikey);
            if (isMatch) {
                matchedKey = key;
                break;
            }
        }

        if (!matchedKey) {
            return res.status(401).json({
                success: false,
                message: 'Invalid API key'
            });
        }

        if (matchedKey.token <= 400) {
            return res.status(403).json({
                success: false,
                message: `Token limit reached for this API key ${matchedKey.token}.`
            });
        }

        req.apiKey = matchedKey;
        next();

    } catch (error) {
        logger.error('API key middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};