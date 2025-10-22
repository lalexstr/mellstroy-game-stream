import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export class SettingsController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // Получить настройку
    public getSetting = async (req: Request, res: Response): Promise<void> => {
        try {
            const { key } = req.params;

            const setting = await this.prisma.settings.findUnique({
                where: { key },
            });

            if (!setting) {
                res.status(404).json({ error: 'Setting not found' });
                return;
            }

            res.status(200).json(setting);
        } catch (error) {
            console.error('Error getting setting:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };

    // Получить все настройки
    public getAllSettings = async (_req: Request, res: Response): Promise<void> => {
        try {
            const settings = await this.prisma.settings.findMany();
            res.status(200).json(settings);
        } catch (error) {
            console.error('Error getting settings:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };

    // Обновить настройку (admin)
    public updateSetting = async (req: Request, res: Response): Promise<void> => {
        try {
            const { key } = req.params;
            const { value, description } = req.body;

            if (value === undefined) {
                res.status(400).json({ error: 'Value is required' });
                return;
            }

            const setting = await this.prisma.settings.upsert({
                where: { key },
                update: {
                    value: value.toString(),
                    ...(description && { description }),
                },
                create: {
                    key,
                    value: value.toString(),
                    description,
                },
            });

            res.status(200).json(setting);
        } catch (error) {
            console.error('Error updating setting:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };

    // Сбросить баланс (admin)
    public resetBalance = async (_req: Request, res: Response): Promise<void> => {
        try {
            const maxBalanceSetting = await this.prisma.settings.findUnique({
                where: { key: 'mellstroy_max_balance' },
            });

            const maxBalance = maxBalanceSetting?.value || '1000000000'; // 1 миллиард по умолчанию

            const setting = await this.prisma.settings.upsert({
                where: { key: 'mellstroy_balance' },
                update: {
                    value: maxBalance,
                },
                create: {
                    key: 'mellstroy_balance',
                    value: maxBalance,
                    description: 'Текущий баланс Мелстроя',
                },
            });

            // Удалить все покупки
            await this.prisma.purchase.deleteMany();

            res.status(200).json({
                message: 'Balance reset successfully',
                setting,
            });
        } catch (error) {
            console.error('Error resetting balance:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };
}

