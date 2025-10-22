import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthMiddleware } from '../middleware/auth';

export const createAuthRouter = (
  authController: AuthController, 
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();

  // Публичные маршруты
  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/request-password-reset', authController.requestPasswordReset);

  // Защищённые маршруты
  router.get('/profile', authMiddleware.authenticate, authController.getProfile);
  router.post('/change-password', authMiddleware.authenticate, authController.changePassword);

  return router;
};

