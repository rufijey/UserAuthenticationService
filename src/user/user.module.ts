import { forwardRef, Module } from '@nestjs/common';
import {UserRepository} from "./user.repository";

@Module({
    providers: [UserRepository],
    imports: [],
    exports: [UserRepository],
})
export class UserModule {
}
