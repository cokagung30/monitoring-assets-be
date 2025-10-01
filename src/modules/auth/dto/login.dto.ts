import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginUserDto {
    @IsString({ message: 'Identity harus berupa string' })
    @IsNotEmpty({ message: 'Identity tidak boleh kosong' })
    identity: string;
    
    @IsString({ message: 'Password harus berupa string' })
    @IsNotEmpty({ message: 'Password tidak boleh kosong' })
    password: string;
}