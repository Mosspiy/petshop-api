import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsArray } from 'class-validator';

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    readonly lineId: string;

    @IsString()
    @IsOptional()
    readonly displayName?: string;

    @IsString()
    @IsOptional()
    readonly pictureUrl?: string;

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
