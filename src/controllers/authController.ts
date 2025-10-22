import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { PrismaClient } from '@prisma/client';
import { JWTService } from '../utils/jwt';
import { EmailService } from '../services/emailService';

export class AuthController {
  private prisma: PrismaClient;
  private jwtService: JWTService;
  private emailService: EmailService;
  
  // Валидация регистрации
  private registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы (@$!%*?&)',
        'string.min': 'Пароль должен содержать минимум 8 символов',
        'string.max': 'Пароль не должен превышать 128 символов'
      }),
  });

  // Валидация логина
  private loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  constructor(prisma: PrismaClient, jwtService: JWTService) {
    this.prisma = prisma;
    this.jwtService = jwtService;
    this.emailService = new EmailService();
  }

  // Проверка на SQL-инъекции
  private containsSQLInjection(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    
    const sqlPatterns = [
      /('|;|--|\/\*|\*\/)/i,
      /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
      /(\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
      /(\bUNION\b)/i,
      /(\bSELECT\b)/i,
      /(\bINSERT\b)/i,
      /(\bUPDATE\b)/i,
      /(\bDELETE\b)/i,
      /(\bDROP\b)/i,
      /(\bCREATE\b)/i,
      /(\bALTER\b)/i,
      /(\bEXEC\b)/i,
      /(\bEXECUTE\b)/i,
      /(UNION\s+SELECT)/i,
      /(DROP\s+TABLE)/i,
      /(DELETE\s+FROM)/i,
      /(INSERT\s+INTO)/i,
      /(UPDATE\s+SET)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Валидация
      const { error } = this.registerSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const { username, email, password } = req.body;

      // Дополнительная проверка на SQL-инъекции
      if (this.containsSQLInjection(password) || this.containsSQLInjection(username) || this.containsSQLInjection(email)) {
        console.warn(`Potential SQL injection attempt during registration: username=${username}, email=${email}`);
        res.status(400).json({ error: 'Недопустимые символы в данных.' });
        return;
      }

      // Проверка существующего пользователя
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        res.status(400).json({ error: 'Пользователь с таким email или username уже существует.' });
        return;
      }

      // Хеширование пароля
      const hashedPassword = await bcrypt.hash(password, 10);

      // Создание пользователя
      const user = await this.prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      });

      // Генерация токена
      const token = this.jwtService.generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
      });

      res.status(201).json({
        message: 'Регистрация успешна!',
        token,
        user,
      });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({ error: 'Ошибка сервера при регистрации.' });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Валидация
      const { error } = this.loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }

      const { email, password } = req.body;

      // Поиск пользователя
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({ error: 'Неверный email или пароль.' });
        return;
      }

      // Проверка пароля (обычный или временный)
      let isPasswordValid = false;
      let isTempPassword = false;

      // Сначала проверяем обычный пароль
      isPasswordValid = await bcrypt.compare(password, user.password);

      // Если обычный пароль не подошел, проверяем временный
      if (!isPasswordValid && (user as any).tempPassword && (user as any).tempPasswordExp && new Date() < (user as any).tempPasswordExp) {
        isPasswordValid = await bcrypt.compare(password, (user as any).tempPassword);
        isTempPassword = true;
      }

      if (!isPasswordValid) {
        res.status(401).json({ error: 'Неверный email или пароль.' });
        return;
      }

      // Генерация токена
      const token = this.jwtService.generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
      });

      res.status(200).json({
        message: isTempPassword ? 'Вход выполнен с временным паролем. Пожалуйста, смените пароль.' : 'Вход выполнен успешно!',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role || 'user',
        },
        mustChangePassword: isTempPassword || (user as any).mustChangePassword,
      });
    } catch (error) {
      console.error('Ошибка входа:', error);
      res.status(500).json({ error: 'Ошибка сервера при входе.' });
    }
  };

  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'Пользователь не найден.' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      res.status(500).json({ error: 'Ошибка сервера.' });
    }
  };

  // Запрос восстановления пароля
  public requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email обязателен.' });
        return;
      }

      // Проверка на SQL-инъекции
      if (this.containsSQLInjection(email)) {
        console.warn(`Potential SQL injection attempt in password reset: email=${email}`);
        res.status(400).json({ error: 'Недопустимые символы в email.' });
        return;
      }

      // Поиск пользователя
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Для безопасности не сообщаем, что пользователь не найден
        res.status(200).json({ 
          message: 'Если пользователь с таким email существует, на него будет отправлено письмо с инструкциями.' 
        });
        return;
      }

      // Генерация временного пароля
      const tempPassword = this.generateTempPassword();
      const tempPasswordExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

      // Обновление пользователя
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          tempPassword: await bcrypt.hash(tempPassword, 10),
          tempPasswordExp,
          mustChangePassword: true,
        } as any,
      });

      // Отправка email
      const emailSent = await this.emailService.sendTempPassword(email, tempPassword, user.username);

      if (emailSent) {
        res.status(200).json({ 
          message: 'Письмо с временным паролем отправлено на ваш email.' 
        });
      } else {
        res.status(500).json({ error: 'Ошибка отправки email. Попробуйте позже.' });
      }
    } catch (error) {
      console.error('Ошибка восстановления пароля:', error);
      res.status(500).json({ error: 'Ошибка сервера при восстановлении пароля.' });
    }
  };

  // Смена пароля (для временного пароля)
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Не авторизован.' });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Текущий и новый пароль обязательны.' });
        return;
      }

      // Проверка на SQL-инъекции
      if (this.containsSQLInjection(currentPassword) || this.containsSQLInjection(newPassword)) {
        console.warn(`Potential SQL injection attempt in password change for user ${userId}`);
        res.status(400).json({ error: 'Недопустимые символы в пароле.' });
        return;
      }

      // Валидация нового пароля
      const passwordSchema = Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required();

      const { error } = passwordSchema.validate(newPassword);
      if (error) {
        res.status(400).json({ error: 'Новый пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы (@$!%*?&)' });
        return;
      }

      // Получение пользователя
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({ error: 'Пользователь не найден.' });
        return;
      }

      // Проверка текущего пароля (обычный или временный)
      let isCurrentPasswordValid = false;
      
      if ((user as any).tempPassword && (user as any).tempPasswordExp && new Date() < (user as any).tempPasswordExp) {
        // Проверка временного пароля
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, (user as any).tempPassword);
      } else {
        // Проверка обычного пароля
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      }

      if (!isCurrentPasswordValid) {
        res.status(401).json({ error: 'Неверный текущий пароль.' });
        return;
      }

      // Хеширование нового пароля
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Обновление пароля
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          tempPassword: null,
          tempPasswordExp: null,
          mustChangePassword: false,
        } as any,
      });

      res.status(200).json({ message: 'Пароль успешно изменен.' });
    } catch (error) {
      console.error('Ошибка смены пароля:', error);
      res.status(500).json({ error: 'Ошибка сервера при смене пароля.' });
    }
  };

  // Генерация временного пароля
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

