import { IsOptional, IsMongoId, IsArray } from 'class-validator';

export class UpdateUserDto {

    @IsArray()
    @IsOptional()
    @IsMongoId({ each: true })
    readonly addresses?: string[];

    @IsMongoId()
    @IsOptional()
    readonly favorites?: string;

    @IsMongoId()
    @IsOptional()
    readonly cart?: string;

    @IsArray()
    @IsOptional()
    @IsMongoId({ each: true })
    readonly orders?: string[];

}
