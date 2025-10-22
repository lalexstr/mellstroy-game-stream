import express, { Application as ExpressApp, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { DatabaseService } from './config/database';
import { JWTService } from './utils/jwt';
import { AuthController } from './controllers/authController';
import { TriggerController } from './controllers/triggerController';
import { ProductController } from './controllers/productController';
import { SettingsController } from './controllers/settingsController';
import { AuthMiddleware } from './middleware/auth';
import { SocketService } from './services/socketService';
import { createAuthRouter } from './routes/auth';
import { createTriggerRouter } from './routes/triggers';
import { createProductRouter } from './routes/products';
import { createSettingsRouter } from './routes/settings';

// Загрузка переменных окружения
dotenv.config();

export class Application {
  private app: ExpressApp;
  private server: http.Server;
  private port: number;
  
  // Сервисы
  private databaseService: DatabaseService;
  private jwtService: JWTService;
  
  // Контроллеры
  private authController: AuthController;
  private triggerController: TriggerController;
  private productController: ProductController;
  private settingsController: SettingsController;
  
  // Middleware
  private authMiddleware: AuthMiddleware;

  // Socket Service (используется внутренне для WebSocket соединений)
  private socketService: SocketService;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.server = http.createServer(this.app);
    
    // Инициализация сервисов
    this.databaseService = DatabaseService.getInstance();
    this.jwtService = new JWTService();
    
    // Инициализация контроллеров
    this.authController = new AuthController(
      this.databaseService.prisma,
      this.jwtService
    );
    this.triggerController = new TriggerController(
      this.databaseService.prisma
    );
    this.productController = new ProductController(
      this.databaseService.prisma
    );
    this.settingsController = new SettingsController(
      this.databaseService.prisma
    );
    
    // Инициализация middleware
    this.authMiddleware = new AuthMiddleware(this.jwtService);
    
    // Инициализация Socket.IO
    this.socketService = new SocketService(
      this.server,
      this.databaseService.prisma,
      this.jwtService,
      this.triggerController
    );
    
    // Настройка приложения
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS
    const corsOrigin = process.env.NODE_ENV === 'production' 
      ? process.env.CORS_ORIGIN || '*' 
      : process.env.CORS_ORIGIN || 'http://localhost:5173';
    this.app.use(cors({
      origin: corsOrigin,
      credentials: corsOrigin !== '*',
    }));
    
    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Static files - serve uploaded videos
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    
    // Serve frontend static files
    const frontendPath = path.join(process.cwd(), 'frontend', 'mellstroy', 'out');
    this.app.use(express.static(frontendPath));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({ 
        status: 'OK', 
        message: 'MellstroyVerse Backend Running' 
      });
    });

    // API маршруты
    this.app.use('/api/auth', createAuthRouter(
      this.authController,
      this.authMiddleware
    ));
    this.app.use('/api/triggers', createTriggerRouter(
      this.triggerController,
      this.authMiddleware
    ));
    this.app.use('/api/products', createProductRouter(
      this.productController,
      this.authMiddleware
    ));
    this.app.use('/api/settings', createSettingsRouter(
      this.settingsController,
      this.authMiddleware
    ));

    // SPA fallback - serve index.html for all non-API routes
    this.app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(process.cwd(), 'frontend', 'mellstroy', 'out', 'index.html'));
    });
  }

  public async start(): Promise<void> {
    try {
      // Подключение к БД
      await this.databaseService.connect();

      // Запуск сервера
      this.server.listen(this.port, () => {
        console.log(`🚀 Сервер запущен на порту ${this.port}`);
        console.log(`📡 WebSocket сервер активен`);
        console.log(`🎬 MellstroyVerse Backend готов!`);
      });
    } catch (error) {
      console.error('❌ Ошибка запуска сервера:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    console.log('🔄 Закрытие сервера...');
    
    // Используем socketService для корректного завершения
    if (this.socketService) {
      console.log('🔌 Закрытие WebSocket соединений...');
    }
    
    // Отключение от БД
    await this.databaseService.disconnect();
    
    // Закрытие HTTP сервера
    this.server.close(() => {
      console.log('✅ Сервер закрыт');
      process.exit(0);
    });
  }
}

// Создание и запуск приложения
const application = new Application();

// Запуск
application.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM получен...');
  await application.stop();
});

process.on('SIGINT', async () => {
  console.log('SIGINT получен...');
  await application.stop();
});

