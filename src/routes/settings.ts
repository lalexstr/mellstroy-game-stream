import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { AuthMiddleware } from '../middleware/auth';

export const createSettingsRouter = (
  settingsController: SettingsController,
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();

  // Публичные роуты
  router.get('/:key', settingsController.getSetting);
  router.get('/', settingsController.getAllSettings);

  // Админские роуты
  router.put('/:key', authMiddleware.authenticate, authMiddleware.requireAdmin, settingsController.updateSetting);
  router.post('/reset-balance', authMiddleware.authenticate, authMiddleware.requireAdmin, settingsController.resetBalance);

  return router;
};

