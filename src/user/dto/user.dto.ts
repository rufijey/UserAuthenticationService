
export class UserDto {
    readonly id: number;

    readonly email: string;

    readonly name: string;

    constructor(
        id: number,
        email: string,
        name: string,
    ) {
        this.id = id;
        this.email = email;
        this.name = name;
    }
}