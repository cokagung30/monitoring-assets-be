import { Module } from "@nestjs/common";
import { FirebaseModule } from "src/common/firebase/firebase.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthMiddleware } from "src/common/middleware/jwt-auth.middleware";

@Module({
    imports: [FirebaseModule],
    controllers: [AuthController],
    providers: [AuthService, JwtAuthMiddleware],
    exports: [AuthService, JwtAuthMiddleware],
})
export class AuthModule {}