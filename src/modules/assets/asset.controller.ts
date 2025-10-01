import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AssetService } from "./asset.service";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { ResponseUtil } from "src/common/utils/response.util";

@Controller('asset')
export class AssetController {
    constructor (private readonly service: AssetService) {}

    @Post('')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() request: CreateAssetDto) {
        try {
            const result = await this.service.create(request);

            return ResponseUtil.success(result, 'Asset berhasil ditambahkan');
        } catch (error) {
            return ResponseUtil.error(error.message);
        }
    }
}