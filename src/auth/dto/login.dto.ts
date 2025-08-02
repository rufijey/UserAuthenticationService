import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {

    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @IsString()
    @IsNotEmpty()
    readonly password: string;


    constructor(
        email: string,
        password: string,
    ) {
        this.email = email;
        this.password = password;
    }
}