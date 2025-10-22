import jwt from "jsonwebtoken";

export interface JWTPayload {
    id: string;
    username: string;
    email: string;
    role: string;
}

export class JWTService {
    private readonly jwtSecret: string;
    private readonly jwtExpire: string | number;

    constructor(){
        this.jwtSecret = process.env.JWT_SECRET || "secret_jsonwebtoken_for_mellstroy";
        this.jwtExpire = process.env.JWT_EXPIRE || '7d';
    }

    public generateToken(payload: JWTPayload): string {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpire as any,
        });
    }

    public verifyToken(token: string): JWTPayload | null {
        try {
          return jwt.verify(token, this.jwtSecret) as JWTPayload;
        } catch (error) {
          return null;
        }
      }
}