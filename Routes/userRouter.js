import { Router } from 'express';
import { getAllUsers, getUserDetails, login, requestOtp, verifyOtp, register } from '../Controllers/userController.js';
import { authMiddleware, requireAdmin } from '../Middlewares/authMiddleware.js';

const userRouter = Router();

userRouter.get('/', authMiddleware, requireAdmin, getAllUsers);
userRouter.get('/:id/details', authMiddleware, requireAdmin, getUserDetails);
userRouter.post('/login', login);
userRouter.post('/request-otp-only', requestOtp);
userRouter.post('/verify-otp', verifyOtp);
userRouter.post('/', register);

export default userRouter;