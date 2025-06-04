import { IsNotEmpty, IsMongoId } from 'class-validator';

export class DeleteAddressDto {
    @IsMongoId()
    @IsNotEmpty()
    readonly userId: string; // สร้างไว้ใช้เช็คว่าจะลบ address ของ user ไหน
}