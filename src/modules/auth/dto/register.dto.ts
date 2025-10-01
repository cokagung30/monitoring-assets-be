import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @IsString({message: 'Email harus berupa string'})
    @IsNotEmpty({ message: 'Email tidak boleh kosong' })
    email: string;

    @IsString({ message: 'Username harus berupa string' })
    @MinLength(3, { message: 'Username minimal 3 karakter' })
    username: string;

    @IsString({ message: 'Password harus berupa string' })
    @MinLength(8, { message: 'Password minimal 8 karakter' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message: 'Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, 1 angka, dan 1 karakter khusus'
        }
    )
    password: string;

    @IsString({message: 'Nama harus berupa string'})
    @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
    name: string;
}