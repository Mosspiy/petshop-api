import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateFavoriteDto {
    @IsMongoId()
    @IsNotEmpty()
    readonly userId: string;
}
