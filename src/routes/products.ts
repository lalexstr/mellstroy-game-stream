import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { AuthMiddleware } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';

export const createProductRouter = (
  productController: ProductController,
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();

  // Публичные роуты
  router.get('/', productController.getAllProducts);
  router.get('/stats', productController.getPurchaseStats);

  // Покупка товара (требует авторизации)
  router.post('/:id/purchase', authMiddleware.authenticate, productController.purchaseProduct);

  // Админские роуты
  router.post(
    '/upload',
    authMiddleware.authenticate,
    authMiddleware.requireAdmin,
    uploadImage.single('image'),
    productController.uploadImage
  );
  router.post('/', authMiddleware.authenticate, authMiddleware.requireAdmin, productController.createProduct);
  router.put('/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, productController.updateProduct);
  router.delete('/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, productController.deleteProductWithImage);

  return router;
};

