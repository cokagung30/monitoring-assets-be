import { Injectable, Logger, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { NextFunction, Request } from "express";
import * as jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
    private readonly logger = new Logger(JwtAuthMiddleware.name);
    private readonly jwtSecret = process.env.JWT_SECRET || 'secret-key';

    use(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader) {
                this.logger.warn('No Authorization header found');
                throw new UnauthorizedException({
                    message: 'No Authorization header found',
                    error: 'Unauthorized',
                    statusCode: 401,
                });
            }

            if (!authHeader.startsWith('Bearer ')) {
                this.logger.warn('Invalid Authorization header format');
                throw new UnauthorizedException({
                    message: 'Format token invalid',
                    error: 'Unauthorized',
                    statusCode: 401,
                });
            }

            const token = authHeader.substring(7);
            
            if (!token) {
                this.logger.warn('Empty token provided');
                throw new UnauthorizedException({
                    message: 'Token is empty',
                    error: 'Unauthorized',
                    statusCode: 401,
                });
            }

            try {
                const decoded = jwt.verify(token, this.jwtSecret);

                req.user = decoded;

                this.logger.log(
                    `Token validated successfully for user: ${(decoded as any).userId || 'unknown'}`
                );

                next();
            } catch (jwtError) {
                this.logger.warn(`JWT verification failed: ${jwtError.message}`);

                if (jwtError.name === 'TokenExpiredError') {
                    throw new UnauthorizedException({
                        message: 'Token is expired',
                        error: jwtError.message,
                        statusCode: 401,
                    });
                } else if (jwtError.name === 'JsonWebTokenError') {
                    throw new UnauthorizedException({
                        message: 'Invalid token',
                        error: jwtError.message,
                        statusCode: 401,
                    });
                } else if (jwtError.name === 'NotBeforeError') {
                    throw new UnauthorizedException({
                        message: 'Token not active',
                        error: jwtError.message,
                        statusCode: 401,
                    });
                } else {
                    throw new UnauthorizedException({
                        message: 'Token verification failed',
                        error: jwtError.message,
                        statusCode: 401,
                    });
                }
            }
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }

            this.logger.error(`Unexpected error in JWT middleware: ${error.message}`, error.stack);
            throw  new UnauthorizedException({
                message: 'Authentication failed due to an unexpected error',
                error: error.message,
                statusCode: 401
            });
        }
    }
}