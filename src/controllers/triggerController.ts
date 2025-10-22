import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TriggerMatch } from '../types';
import fs from 'fs';
import path from 'path';

export class TriggerController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    public async findTrigger(message:string): Promise<TriggerMatch | null> {
        try {
            const messageLower = message.toLowerCase();

            const triggers = await this.prisma.trigger.findMany({
                where:{ isActive: true },
                orderBy: { priority: 'desc' },
            });

            for (const trigger of triggers) {
                if( messageLower.includes(trigger.keyword.toLowerCase())) {
                    return {
                        keyword: trigger.keyword,
                        videoUrl: trigger.videoUrl,
                        category: trigger.category,
                        priority: trigger.priority,
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('error trigger', error);
            return null;
        }
    }

    public getAllTriggers = async (_req: Request, res: Response): Promise<void> => {
        try {
            const triggers = await this.prisma.trigger.findMany({
                orderBy: { priority: 'desc'},
            });
            res.status(200).json(triggers);
        } catch (error) {
            console.error('error receiving triggers', error);
            res.status(500).json({ error: 'error server' });
        }
    };

    public createTrigger = async(req: Request, res: Response): Promise<void> => {
        try {
            const { keyword, videoUrl, category, priority } = req.body;

            if(!keyword || !videoUrl || !category) {
                res.status(400).json({ error: 'Заполните все обязательные поля.'});
                return;
            }

            const trigger = await this.prisma.trigger.create({
                data: {
                    keyword,
                    videoUrl,
                    category,
                    priority: priority || 0,
                },
            });

            res.status(201).json(trigger);
        } catch (error) {
            console.error('error create trigger', error);
            res.status(500).json({ error: 'error server' });
        }
    };

    public updateTrigger = async (req: Request, res: Response): Promise<void> => {
        try {
            const{ id } = req.params;
            const { keyword, videoUrl, category, priority, isActive } = req.body;

            const trigger = await this.prisma.trigger.update({
                where: { id },
                data: {
                    ...(keyword && { keyword }),
                    ...(videoUrl && { videoUrl }),
                    ...(category && { category }),
                    ...(priority !== undefined && { priority }),
                    ...(isActive !== undefined && { isActive }),
                },
            });
            res.status(200).json(trigger);
        } catch (error) {
            console.error(' error update trigger', error);
            res.status(500).json({ error: 'error server' });
        }
    };

    public deleteTrigger = async(req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            // Get trigger to delete video file
            const trigger = await this.prisma.trigger.findUnique({
                where: { id },
            });

            if (trigger && trigger.videoUrl.startsWith('http://localhost:')) {
                // Delete local video file
                const filename = path.basename(trigger.videoUrl);
                const filepath = path.join(process.cwd(), 'uploads', 'videos', filename);
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
            }

            await this.prisma.trigger.delete({
                where: { id },
            });

            res.status(200).json({ message: 'trigger delete' });
        } catch(error) {
            console.error('error delete trigger', error);
            res.status(500).json({ error: 'error server' });
        }
    };

    // Upload video file
    public uploadVideo = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No video file provided' });
                return;
            }

            // Generate URL for the uploaded file
            const videoUrl = `http://localhost:${process.env.PORT || 3000}/uploads/videos/${req.file.filename}`;

            res.status(200).json({
                message: 'Video uploaded successfully',
                filename: req.file.filename,
                videoUrl,
            });
        } catch (error) {
            console.error('Error uploading video:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };
}