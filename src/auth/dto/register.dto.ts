import {IsEmail, IsNotEmpty, IsString} from "class-validator";

export class RegisterDto {

    @IsEmail()
    readonly email: string;

    @IsString()
    readonly name: string;
    
    @IsString()
    readonly password: string;

    constructor(
        email: string,
        name: string,
        password: string,
    ) {
        this.email = email;
        this.name = name;
        this.password = password;
    }
}