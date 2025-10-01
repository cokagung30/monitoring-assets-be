import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Ip, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { ResponseUtil } from "src/common/utils/response.util";
import { LoginUserDto } from "./dto/login.dto";
import { JwtAuthMiddleware } from "src/common/middleware/jwt-auth.middleware";

@Controller('auth')
export class AuthController {
    constructor(private readonly service: AuthService) {}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() request: RegisterDto) {
        try {
            const result = await this.service.register(request);

            return ResponseUtil.success(result, 'Registration success');
        } catch (error) {
            return ResponseUtil.error(error.message);
        }
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() request: LoginUserDto,
        @Headers('user-agent') userAgent: string,
        @Ip() ipAddress: string,
    ) {
        try {
            const result = await this.service.login(request, userAgent, ipAddress);

            return ResponseUtil.success(result, 'Login success');
        } catch (error) {
            return ResponseUtil.error(error.message);
        }
    }

    @Post('logout')
    @UseGuards(JwtAuthMiddleware)
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req: any) {
        try {
            const result = await this.service.logout(
                req.user.id, 
                req.user.deviceId
            );

            return ResponseUtil.success(result, 'Logout success');
        } catch (error) {
            return ResponseUtil.error(error.message);
        }
    }

    @Get('profile')
    @UseGuards(JwtAuthMiddleware)
    async getProfile(@Request() req: any) {
        try {
            const user = await this.service.getUser(req.user.id);
            if (!user) {
                return ResponseUtil.error('User tidak ditemukan');
            }

            const { password, ...userWithoutPassword } = user;
            return ResponseUtil.success(userWithoutPassword, 'Get profile success');
        } catch (error) {
            return ResponseUtil.error(error.message);
        }
    }
}