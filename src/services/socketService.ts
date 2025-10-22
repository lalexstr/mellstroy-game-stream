import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { JWTService } from '../utils/jwt';
import { TriggerController } from '../controllers/triggerController';
import { ChatMessage, DonationData, WebRTCSignal } from '../types';

export class SocketService {
    private io: SocketIOServer;
    private connectedUsers: Map<string, string> = new Map(); // socketId -> userId
    private prisma: PrismaClient;
    private jwtService: JWTService;
    private triggerController: TriggerController;

    constructor(
        server: HTTPServer, 
        prisma: PrismaClient, 
        jwtService: JWTService,
        triggerController: TriggerController
      ) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.triggerController = triggerController;

        const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
        this.io = new SocketIOServer( server, {
            cors: {
                origin: corsOrigin,
                methods: ['GET', 'POST'],
                credentials: corsOrigin !== '*',
            },
        });
        this.initializeHandlers();
     }

     private initializeHandlers(): void {
        this.io.on('connection', (socket: Socket) => {
            console.log(`user connect ${socket.id}`);

            socket.on('authenticate', async(token: string) => {
                const user = this.jwtService.verifyToken(token);
                if(user) {
                    this.connectedUsers.set(socket.id, user.id);
                    socket.data.user = user;
                    socket.emit('authenticated', { success: true, user });
                } else {
                    socket.emit('authenticated', { success: false, error: 'error token'});
                }
            });

            socket.on('chat:message', async( data: { content: string }) => {
                await this.handleChatMessage(socket, data.content);
            });

            socket.on('donation', async(data: DonationData ) => {
                await this.handleDonation(socket, data);
            });

            socket.on('webrtc:signal', (data: WebRTCSignal) => {
                this.handleWebRTCSignal(socket, data);
            });

            socket.on('disconnect', () => {
                this.connectedUsers.delete(socket.id);
                console.log(`user disconnect: ${socket.id}`);
            });
        });
     }

     private async handleChatMessage( socket: Socket, content: string): Promise<void> {
        try {
            const user = socket.data.user;
            if(!user) {
                socket.emit('error', { message: 'not authorized' });
                return;
            }

            const message = await this.prisma.message.create({
                data: {
                    content,
                    userId: user.id,
                    type: 'text',
                },
                include: {
                    user: {
                        select:{
                            username: true,
                            avatar: true,
                        },
                    },
                },
            });

            const ChatMessage: ChatMessage = {
                id: message.id,
                content: message.content,
                username: message.user.username,
                userId: message.userId,
                avatar: message.user.avatar || undefined,
                timestamp: message.createdAt,
                type: 'text',
            };

            this.io.emit('chat:message', ChatMessage);

            const trigger = await this.triggerController.findTrigger(content);
            if(trigger) {
                console.log(`Trigger found ${trigger.keyword} -> ${trigger.category}`);
                this.io.emit('mellstoy:reaction', {
                    videoUrl: trigger.videoUrl,
                    category: trigger.category,
                    triggeredBy: user.username,
                    message: content,
                });
            }
        } catch (error) {
            console.error('error message processing', error);
            socket.emit('error', { message: 'error sending message' });
        }
     }

     private async handleDonation(socket: Socket, data: DonationData): Promise<void> {
        try {
            const user = socket.data.user;
            if(!user) {
                socket.emit('error', {message: 'not auth' });
                return;
            }

            const donation = await this.prisma.donation.create({
                data: {
                    amount: data.amount,
                    message: data.message,
                    userId: user.id,
                },
                include: {
                    user: {
                        select:{
                            username: true,
                            avatar: true,
                        },
                    },
                },
            });

            this.io.emit('donation:received', {
                id: donation.id,
                amount: donation.amount,
                message: donation.message,
                username: donation.user.username,
                timestamp: donation.createdAt,
            });

            const donationTrigger = await this.prisma.trigger.findFirst({
                where: {
                    category: 'donation',
                    isActive: true,
                },
                orderBy: { priority: 'desc' },
            });

            if(donationTrigger) {
                this.io.emit('mellstroy:reaction', {
                    videoUrl: donationTrigger.videoUrl,
                    category: 'donation',
                    triggeredBy: user.username,
                    amount: data.amount
                });
            }
        }catch(error) {
            console.log('error donation', error);
            socket.emit('error', {message: 'error donut processing' });
        }
     }

     private handleWebRTCSignal(socket: Socket, data: WebRTCSignal): void{
        socket.to(data.roomId).emit('webrtc:signal', {
            type: data.type,
            signal: data.signal,
            userId: data.userId,
        });
     }
     public getIO(): SocketIOServer{
        return this.io;
     }
}