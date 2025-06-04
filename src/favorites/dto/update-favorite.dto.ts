import { IsMongoId, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class FavoriteItemDto {
    @IsMongoId()
    @IsNotEmpty()
    readonly productId: string;
}

export class UpdateFavoriteDto {
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FavoriteItemDto)
    readonly items: FavoriteItemDto[];
}
