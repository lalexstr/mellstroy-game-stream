import { PrismaClient } from "@prisma/client";

export class DatabaseService {
    private static instance: DatabaseService;
    public readonly prisma: PrismaClient;

    private constructor() {
        this.prisma = new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }

    public static getInstance(): DatabaseService {
        if(!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async connect(): Promise<void> {
        try {
            await this.prisma.$connect();
            console.log('database connect');
        } catch (error) {
            console.log('error connect db', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
        console.log('disconnect bd');
    }
}

const databaseService = DatabaseService.getInstance();
export default databaseService.prisma;