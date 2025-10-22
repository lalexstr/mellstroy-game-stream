import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { JWTService } from '../utils/jwt';

export class AuthMiddleware {
    private jwtService: JWTService;
    constructor(jwtService: JWTService){
        this.jwtService = jwtService;
    }

    public authenticate = (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): void => {
        try{
            const authHeader = req.headers.authorization;

            if(!authHeader || !authHeader.startsWith('Bearer')) {
                res.status(401).json({ error: 'Not authorized' });
                return;
            }
            const token = authHeader.substring(7);
            const decoded = this.jwtService.verifyToken(token);

            if(!decoded) {
                res.status(401).json({ error: 'token invalid' });
                return;
            }

            req.user = decoded;
            next();
        } catch(error) {
            res.status(401).json({ error: 'error auth' });
        }
    };

    public requireAdmin = (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authorized' });
            return;
        }

        if (req.user.role !== 'admin') {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }

        next();
    };
}
