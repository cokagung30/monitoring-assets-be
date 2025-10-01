export interface Device {
    id: string;
    name: string;
    userAgent: string;
    ipAddress: string;
    lastLoginAt: Date;
    isActive: boolean;    
}

export interface User {
    id: string;
    email: string;
    username: string;
    password: string;
    name: string;
    isActive: boolean;
    devices: Device[];
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSession { 
    userId: string;
    deviceId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}