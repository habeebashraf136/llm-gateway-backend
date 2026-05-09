import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import redis from '../config/cache.js';



export const isAuthenticated = async(req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Please provide a token',
        });
    }

    const accessToken = authHeader.split(' ')[1];

    if(!accessToken){
        return res.status(401).json({
            success:false,
            message:'Please provide a token',
        });
    }

    try{
        const isBlacklisted = await redis.get(`blacklist:${accessToken}`);

        if(isBlacklisted){
            return res.status(401).json({
                success:false,
                message:'Token is blacklisted',
            });
        }

        const decoded = jwt.verify(
            accessToken,
            config.ACCESS_TOKEN_SECRET
        )
        req.user = decoded;
        next();
    }
    catch(err){
        return res.status(401).json({
            success:false,
            message:'Invalid token',
        });
    }
}
