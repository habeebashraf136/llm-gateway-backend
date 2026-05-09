import userModel from '../models/user.model.js';
import asyncHandler from '../utils/async.handler.js';
import redis from '../config/cache.js';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { v4 as uuidv4 } from 'uuid';
import apikeyModel from '../models/apikey.model.js';



const generateAccessToken = (userid) => {
    return jwt.sign(
        {userid},
        config.ACCESS_TOKEN_SECRET,
        {expiresIn:'15m'}
    )
}

const generateRefreshToken = (userid) => {
    return jwt.sign(
        {userid},
        config.REFRESH_TOKEN_SECRET,
        {expiresIn:'30d'}
    )
}

export const registerUser = asyncHandler(async (req,res,next) => {
    const { username, email, password } = req.body;

    if(!username || !email || !password){
        return res.status(400).json({
            success:false,
            message:'Please provide username, email, and password',
        });
    }

    const userExists = await userModel.findOne({
        $or:[{username},{email}],
    });

    if(userExists){
        return res.status(400).json({
            success:false,
            message:'User already exists',
        });
    }

    const user = await userModel.create({
        username,
        email,
        password,
    });

    const apikey = uuidv4();

    await apikeyModel.create({
        user:user._id,
        apikey,
        reqCount:0,
    });

    const refreshToken = generateRefreshToken(user._id);
    const accessToken = generateAccessToken(user._id);

    await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 2592000);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    res.status(201).json({
        success:true,
        message:'User registered successfully',
        user:{
            userid:user._id,
            username:user.username,
            email:user.email,
        },
        accessToken,
        apikey,
    })
});

export const loginUser = asyncHandler(async (req,res,next) => {
    const { email, password } = req.body;

    const user = await userModel.findOne({email}).select('+password');

    if(!user){
        return res.status(400).json({
            success:false,
            message:'User not found',
        });
    }

    const isMatch = await user.comparePassword(password);

    if(!isMatch){
        return res.status(400).json({
            success:false,
            message:'Password is incorrect',
        });
    }

    const refreshToken = generateRefreshToken(user._id);
    const accessToken = generateAccessToken(user._id);

    await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 2592000);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    res.status(200).json({
        success:true,
        message:'User logged in successfully',
        user:{
            userid:user._id,
            username:user.username,
            email:user.email,
        },
        accessToken
    })
});

export const getRefreshToken = asyncHandler(async (req,res,next) => {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(400).json({
            success:false,
            message:'Please provide a refresh token',
        });
    }

    const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);

    const stored = await redis.get(`refresh:${decoded.userid}`);

    if(stored !== refreshToken){
        return res.status(400).json({
            success:false,
            message:'Invalid refresh token',
        });
    }

    const accessToken = generateAccessToken(decoded.userid);

    res.status(200).json({
        success:true,
        message:'User refreshed successfully',
        accessToken
    })
    
});

export const getUserInfo = asyncHandler(async (req,res,next) => {
    const userid = req.user.userid;

    const user = await userModel.findOne({
        _id:userid,
    })

    if(!user){
        return res.status(400).json({
            success:false,
            message:'User not found',
        });
    }

    res.status(200).json({
        success:true,
        message:'User info successfully',
        user:{
            userid:user._id,
            username:user.username,
            email:user.email,
        }
    })
})

export const logoutUser = asyncHandler(async (req,res,next) => {
    const refreshtoken = req.cookies.refreshToken;

    if(!refreshtoken){
        return res.status(400).json({
            success:false,
            message:'Please provide a refresh token',
        });
    }

    try{
        const decoded = jwt.verify(refreshtoken, config.REFRESH_TOKEN_SECRET);
        await redis.del(`refresh:${decoded.userid}`);

        const authHeader = req.headers.authorization;
        const accessToken = authHeader ? authHeader.split(' ')[1] : null;   

        if(accessToken){
            const decodedAccess = jwt.verify(accessToken, config.ACCESS_TOKEN_SECRET);
            const remainingTime = decodedAccess.exp - Math.floor(Date.now() / 1000);
            if(remainingTime > 0){
                await redis.set(`blacklist:${accessToken}`, 'true', 'EX', remainingTime);
            }
        }

    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid token or refresh token"
        });
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return res.status(200).json({
        success: true,
        message: "User logged out successfully"
    });
})