import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { FirebaseModule } from "src/common/firebase/firebase.module";
import { AssetController } from "./asset.controller";
import { JwtAuthMiddleware } from "src/common/middleware/jwt-auth.middleware";
import { AssetService } from "./asset.service";

@Module({
    imports: [FirebaseModule],
    controllers: [AssetController],
    providers: [AssetService],
    exports: [AssetService]
})
export class AssetModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(JwtAuthMiddleware).forRoutes(AssetController);
    }
}