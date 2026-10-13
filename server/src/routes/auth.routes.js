import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const signupSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

const demoLoginSchema = {
  body: z.object({
    role: z.enum(['member', 'moderator', 'admin']),
    orgSlug: z.string().optional(),
  }),
};

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/demo-login', validate(demoLoginSchema), authController.demoLogin);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.me);

export default router;
