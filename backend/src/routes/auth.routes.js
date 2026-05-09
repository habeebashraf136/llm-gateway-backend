import { Router } from 'express';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';
import { registerUser, loginUser, getRefreshToken, getUserInfo, logoutUser } from '../controllers/auth.controller.js';
import { authLimiter } from '../utils/rate.limit.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';


const authRouter = Router();


// @Route POST /api/auth/register
// @Desc Register a new user
// @Access Public
authRouter.post('/register',authLimiter, registerValidator, registerUser);

// @Route POST /api/auth/login
// @Desc Login a user
// @Access Public
authRouter.post('/login',authLimiter, loginValidator, loginUser);

// @Route get /api/auth/refresh
// @Desc get a new access token
// @Access Public
authRouter.get('/get-refresh', getRefreshToken);

// @Router get /api/auth/get-user
// @Desc get user info
// @Access Private
authRouter.get('/get-user', isAuthenticated, getUserInfo);


// @Route POST /api/auth/logout
// @Desc Logout a user
// @Access Private
authRouter.post('/logout', isAuthenticated, logoutUser);






export default authRouter;
