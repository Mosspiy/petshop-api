import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateCartDto {
    @IsMongoId()
    @IsNotEmpty()
    readonly userId: string;
}
