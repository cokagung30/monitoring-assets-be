import { IsDate, IsNotEmpty, IsNumber, IsString, MinLength } from "class-validator";

export class CreateAssetDto {
    @IsString({ message: 'Nama harus berupa string' })
    @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
    name: string;

    @IsString({ message: 'Tipe harus berupa string' })
    @IsNotEmpty({ message: 'Tipe tidak boleh kosong' })
    type: string;

    @IsString({ message: 'Dokumen harus berupa string' })
    document?: string;

    @IsString({ message: 'Desa harus berupa string' })
    village?: string;

    @IsString({ message: 'Kecamatan harus berupa string' })
    subdistrict?: string;

    @IsNumber({}, { message: 'Luas harus berupa number' })
    wide?: number;

    @IsDate({ message: 'Tanggal perjanjian harus berupa Date' })
    dateAggrement?: Date;

    @IsString({ message: 'Sebelum pengunaan harus berupa string' })
    beforeUse?: string;

    @IsString({ message: 'Sesudah pengunaan harus berupa string' })
    afterUse?: string;

    @IsString({ message: 'Keterangan harus berupa string' })
    information?: string;


}