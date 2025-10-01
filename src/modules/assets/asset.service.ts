import { BadRequestException, ConflictException, Injectable, Logger } from "@nestjs/common";
import { FirebaseService } from "src/common/firebase/firebase.service";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { v4 as uuidv4 } from 'uuid';
import { Asset } from "./interfaces/asset.interfaces";

@Injectable()
export class AssetService {
    private readonly logger = new Logger(AssetService.name);
    
    constructor(private readonly firebaseService: FirebaseService) {}

    async create(createAssetDto: CreateAssetDto): Promise<{message: string, assetId: string}> {
        try {
            const assetId = uuidv4();
            const assetData: Omit<Asset, 'id'> = {
                name: createAssetDto.name,
                type: createAssetDto.type,
                document: createAssetDto.document,
                village: createAssetDto.village,
                subdistrict: createAssetDto.subdistrict,
                wide: createAssetDto.wide,
                dateAggrement: createAssetDto.dateAggrement,
                beforeUse: createAssetDto.beforeUse,
                afterUse: createAssetDto.afterUse,
                information: createAssetDto.information,
                createdAt: new Date(),
            }

            await this.firebaseService.createDocument('assets', assetData, assetId);

            this.logger.log(`Create asset successfully: ${createAssetDto.name}`);

            return {
                message: 'Asset berhasil ditambahkan',
                assetId,
            };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }

            this.logger.error('Error during create new asset', error);
            throw new BadRequestException('Gagal menambahkan Aset');
        }
    }
}