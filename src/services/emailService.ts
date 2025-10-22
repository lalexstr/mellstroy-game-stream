import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Настройка для Gmail (можно изменить на другие провайдеры)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password', // Используйте App Password для Gmail
      },
    });
  }

  // Отправка временного пароля
  async sendTempPassword(email: string, tempPassword: string, username: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'Восстановление пароля - MellstroyVerse',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Восстановление пароля</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-top: 0;">Привет, ${username}!</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Вы запросили восстановление пароля для вашего аккаунта в MellstroyVerse.
              </p>
              
              <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="color: #333; margin: 0 0 10px 0;">Ваш временный пароль:</h3>
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 18px; font-weight: bold; color: #667eea; letter-spacing: 2px;">
                  ${tempPassword}
                </div>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-weight: bold;">⚠️ Важно:</p>
                <ul style="color: #856404; margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Этот пароль действует только 24 часа</li>
                  <li>При первом входе вам будет предложено сменить пароль</li>
                  <li>Не передавайте этот пароль третьим лицам</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© 2024 MellstroyVerse. Все права защищены.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Temp password email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending temp password email:', error);
      return false;
    }
  }

  // Проверка подключения к email сервису
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

