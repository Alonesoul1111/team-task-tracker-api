import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, validate, asyncHandler } from '../../middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));

router.post('/login', validate(loginSchema), asyncHandler(authController.login));

router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refreshToken));

router.post('/logout', authenticate, asyncHandler(authController.logout));

router.get('/me', authenticate, asyncHandler(authController.me));

export { router as authRoutes };
