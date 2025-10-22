import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export class ProductController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // Получить все товары
    public getAllProducts = async (_req: Request, res: Response): Promise<void> => {
        try {
            const products = await this.prisma.product.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
            });
            res.status(200).json(products);
        } catch (error) {
            console.error('Error getting products:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };

    // Создать товар (admin)
    public createProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, description, price, image, category } = req.body;

            if (!name || !price || !category) {
                res.status(400).json({ error: 'Name, price and category are required' });
                return;
            }

            const product = await this.prisma.product.create({
                data: {
                    name,
                    description,
                    price: parseFloat(price),
                    image,
                    category,
                },
            });

            res.status(201).json(product);
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };

    // Обновить товар (admin)
    public updateProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { name, description, price, image, category, isActive } = req.body;

            const product = await this.prisma.product.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(description !== undefined && { description }),
                    ...(price !== undefined && { price: parseFloat(price) }),
                    ...(image !== undefined && { image }),
                    ...(category && { category }),
                    ...(isActive !== undefined && { isActive }),
                },
            });

            res.status(200).json(product);
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };

    // Удалить товар (admin)
    public deleteProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            await this.prisma.product.delete({
                where: { id },
            });

            res.status(200).json({ message: 'Product deleted' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };

    // Купить товар
    public purchaseProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { quantity = 1 } = req.body;
            const userId = (req as any).user?.id;

            const product = await this.prisma.product.findUnique({
                where: { id },
            });

            if (!product || !product.isActive) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }

            const totalPrice = product.price * quantity;

            // Получить текущий баланс
            const balanceSetting = await this.prisma.settings.findUnique({
                where: { key: 'mellstroy_balance' },
            });

            const currentBalance = parseFloat(balanceSetting?.value || '0');

            if (currentBalance < totalPrice) {
                res.status(400).json({ error: 'Insufficient balance' });
                return;
            }

            // Создать покупку
            const purchase = await this.prisma.purchase.create({
                data: {
                    productId: id,
                    userId,
                    quantity,
                    totalPrice,
                },
                include: {
                    product: true,
                    user: {
                        select: {
                            username: true,
                        },
                    },
                },
            });

            // Обновить баланс
            await this.prisma.settings.update({
                where: { key: 'mellstroy_balance' },
                data: {
                    value: (currentBalance - totalPrice).toString(),
                },
            });

            res.status(200).json({
                purchase,
                newBalance: currentBalance - totalPrice,
            });
        } catch (error) {
            console.error('Error purchasing product:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };

    // Получить статистику покупок
    public getPurchaseStats = async (_req: Request, res: Response): Promise<void> => {
        try {
            const totalPurchases = await this.prisma.purchase.count();
            const totalSpent = await this.prisma.purchase.aggregate({
                _sum: {
                    totalPrice: true,
                },
            });

            const topProducts = await this.prisma.purchase.groupBy({
                by: ['productId'],
                _sum: {
                    quantity: true,
                    totalPrice: true,
                },
                orderBy: {
                    _sum: {
                        quantity: 'desc',
                    },
                },
                take: 10,
            });

            const productsWithDetails = await Promise.all(
                topProducts.map(async (item: any) => {
                    const product = await this.prisma.product.findUnique({
                        where: { id: item.productId },
                    });
                    return {
                        product,
                        totalQuantity: item._sum.quantity,
                        totalSpent: item._sum.totalPrice,
                    };
                })
            );

            res.status(200).json({
                totalPurchases,
                totalSpent: totalSpent._sum.totalPrice || 0,
                topProducts: productsWithDetails,
            });
        } catch (error) {
            console.error('Error getting purchase stats:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };

    // Загрузить изображение товара
    public uploadImage = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No image file provided' });
                return;
            }

            // Генерируем URL для загруженного файла
            const imageUrl = `http://localhost:${process.env.PORT || 3000}/uploads/images/${req.file.filename}`;

            res.status(200).json({
                message: 'Image uploaded successfully',
                filename: req.file.filename,
                imageUrl,
            });
        } catch (error) {
            console.error('Error uploading image:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };

    // Удалить товар с его изображением (admin)
    public deleteProductWithImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            // Получить товар для удаления изображения
            const product = await this.prisma.product.findUnique({
                where: { id },
            });

            if (product && product.image && product.image.startsWith(`http://localhost:${process.env.PORT || 3000}/uploads/images/`)) {
                // Удалить локальный файл изображения
                const filename = path.basename(product.image);
                const filepath = path.join(process.cwd(), 'uploads', 'images', filename);
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
            }

            await this.prisma.product.delete({
                where: { id },
            });

            res.status(200).json({ message: 'Product deleted' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };
}

