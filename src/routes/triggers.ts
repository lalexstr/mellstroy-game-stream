import { Router } from 'express';
import { TriggerController } from '../controllers/triggerController';
import { AuthMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

export const createTriggerRouter = (
  triggerController: TriggerController,
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();

  // GET доступен всем (публичный эндпоинт)
  router.get('/', triggerController.getAllTriggers);
  
  // Upload video - только для админов
  router.post(
    '/upload',
    authMiddleware.authenticate,
    authMiddleware.requireAdmin,
    upload.single('video'),
    triggerController.uploadVideo
  );
  
  // Создание, обновление и удаление - только для админов
  router.post('/', authMiddleware.authenticate, authMiddleware.requireAdmin, triggerController.createTrigger);
  router.put('/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, triggerController.updateTrigger);
  router.delete('/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, triggerController.deleteTrigger);

  return router;
};

