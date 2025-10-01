import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { FirebaseService } from "src/common/firebase/firebase.service";
import { RegisterDto } from "./dto/register.dto";
import { Device, User, UserSession } from "./interfaces/user.interface";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { LoginUserDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly jwtSecret = process.env.JWT_SECRET || 'secretKey';
    private readonly tokenExpiry = process.env.JWT_EXPIRES_IN || '7d';
    private readonly maxDevicesPerUser = 5;

    constructor (private readonly firebaseService: FirebaseService) {}

    async register(registerDto: RegisterDto): Promise<User> {
        try {
            const existingUserByEmail = await this.findUserByEmail(registerDto.email);
            if (existingUserByEmail) {
                throw new ConflictException('Email sudah terdaftar');
            }

            const existingUserByUsername = await this.findUserByUsername(registerDto.username);
            if (existingUserByUsername) {
                throw new ConflictException('Username, sudah terdaftar');
            }

            // const existingUserByUsername = await 
            const hashedPassword = await bcrypt.hash(registerDto.password, 12);

            const userId = uuidv4();
            const userData: Omit<User, 'id'> = {
                email: registerDto.email.toLowerCase(),
                username: registerDto.username.toLowerCase(),
                password: hashedPassword,
                isActive: true,
                devices: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                name: registerDto.name,
            };

            await this.firebaseService.createDocument('users', userData, userId);

            this.logger.log(`User registered successfully: ${registerDto.email}`);

            return { id: userId, ...userData };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }

            this.logger.error('Error during user registration', error)
            throw new BadRequestException(error.message);
        }
    }

    async login(
        loginDto: LoginUserDto, 
        userAgent: string, 
        ipAddress: string
    ): Promise<{
        access_token: string;
        user: Omit<User, 'password'>;
    }> {
        try {
            const user = await this.findUserByEmailOrUsername(loginDto.identity);
            if (!user) {
                throw new UnauthorizedException('Identitas atau password tidak dikenali');
            }

            if (!user.isActive) {
                throw new UnauthorizedException('Akun tidak aktif');
            }

            const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Identitas atau password tidak dikenali');
            }

            let existingDevice = user.devices.find(device => device.isActive);
            if (existingDevice) {
                existingDevice.lastLoginAt = new Date();
                existingDevice.userAgent = userAgent;
                existingDevice.ipAddress = ipAddress;
                existingDevice.name = existingDevice.name;
            } else {
                const activeDevices = user.devices.filter(
                    device => device.isActive
                );
                if (activeDevices.length >= this.maxDevicesPerUser) {
                    throw new ForbiddenException(
                        `Maksimal ${this.maxDevicesPerUser} perangkat dapat login. Silakan logout dari perangkat lain terlebih dahulu.`
                    );
                }

                const newDevice: Device = {
                    id: uuidv4(),
                    name: this.extractDeviceName(userAgent),
                    userAgent,
                    ipAddress,
                    lastLoginAt: new Date(),
                    isActive: true,
                };

                user.devices.push(newDevice);
                existingDevice = newDevice
            }

            user.updatedAt = new Date();

            await this.firebaseService.updateDocument('users', user.id, {
                devices: user.devices,
                updatedAt: user.updatedAt,
            });

            // Generate JWT Token
            const payload = {
                userId: user.id,
                email: user.email,
                username: user.username,
            };
            const accessToken = jwt.sign(payload, this.jwtSecret, {
                expiresIn: this.tokenExpiry
            } as jwt.SignOptions);

            const session: UserSession = {
                userId: user.id,
                deviceId: existingDevice.id,
                token: accessToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
            };

            await this.firebaseService.createDocument('sessions', session);

            this.logger.log(`User logged in successfully: ${user.email} from device ${existingDevice.name}`);

            const { password, ...userWithoutPassword } = user;

            return {
                access_token: accessToken,
                user: userWithoutPassword
            };
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
                throw error;
            }

            this.logger.error('Error during login', error);
            throw new BadRequestException('Gagal login');
        }
    }

    async logout(userId: string, deviceId: string): Promise<{message: string}> {
        try {
            const user = await this.findUserById(userId);
            if (!user) {
                throw new UnauthorizedException('User tidak ditemukan');
            }

            const deviceIndex = user.devices.findIndex(device => device.id === deviceId);
            if (deviceIndex === -1) {
                throw new BadRequestException('Device tidak ditemukan');
            }

            user.devices[deviceIndex].isActive = false;
            user.updatedAt = new Date();

            await this.firebaseService.updateDocument('users', userId, {
                devices: user.devices,
                updatedAt: user.updatedAt,
            });

            const sessions = await this.firebaseService.queryDocuments(
                'sessions',
                'userId',
                '==',
                userId
            );

            const userSessions = sessions.filter(session => session.deviceId === deviceId);
            for (const session of userSessions) {
                await this.firebaseService.deleteDocument('sessions', session.id);
            }

            this.logger.log(`User logged out successfully: ${user.email} from device: ${deviceId}`);

            return { message: 'Logout berhasil' };
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error;
            }

            this.logger.error('Error during logout', error);
            throw new BadRequestException('Gagal melakukan logout');
        }
    }

    async getUser(userId: string): Promise<User | null> {
        try {
            const userDoc = await this.firebaseService.getDocument('users', userId);
            if (!userDoc) {
                return null;
            }

            return { id: userId, ...userDoc } as User;
        } catch (error) {
            this.logger.error(`Error getting user by ID: ${error.message}`);
            throw new Error('Gagal mengambil data user');
        }
    }

    private async findUserByUsername(username: string): Promise<User | null> {
        try {
            const users = await this.firebaseService.queryDocuments(
                'users',
                'username',
                '==',
                username.toLowerCase()
            );

            return users.length > 0 ? users[0] : null;
        } catch (error) {
            this.logger.error('Error finding user by username', error);
            return null;
        }
    }

    private async findUserByEmail(email: string): Promise<User | null> {
        try {
            const users = await this.firebaseService.queryDocuments(
                'users',
                'email',
                '==',
                email.toLowerCase()
            );

            return users.length > 0 ? users[0] : null;
        } catch (error) {
            this.logger.error('Error finding user by email', error);
            return null;
        }
    }

    private async findUserByEmailOrUsername(identity: string): Promise<User | null> {
        const isEmail = identity.includes('@');
        return isEmail
            ? await this.findUserByEmail(identity)
            : await this.findUserByUsername(identity);
    }

    private async findUserById(userId: string): Promise<User | null> {
        try {
            const user = await this.firebaseService.getDocument('users', userId);
            return user ? { ...user, id: userId } : null;
        } catch (error) {
            this.logger.error('Error finding user by ID', error);
            return null;
        }
    }

    private extractDeviceName(userAgent: string): string {
        if (userAgent.includes('Mobile')) return 'Mobile Device';
        if (userAgent.includes('Tablet')) return 'Tablet';
        if (userAgent.includes('Windows')) return 'Windows PC';
        if (userAgent.includes('Macintosh')) return 'Mac';
        if (userAgent.includes('Linux')) return 'Linux PC';
        return 'Unknown Device';
    }
}