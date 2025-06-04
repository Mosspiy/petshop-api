import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber } from "class-validator";

export class UpdateOrderDto {
    @IsString()
    @IsOptional() // ทำให้ไม่จำเป็นต้องส่งทุกครั้ง
    status?: string;

    @IsString()
    @IsOptional()
    trackingNumber?: string;
    
    @IsBoolean()
    @IsOptional()
    isReviewed?: boolean;

    @IsNumber()
    @IsOptional()
    discount?: number;
    
    @IsNumber()
    @IsOptional()
    subtotal?: number;
    
    @IsNumber()
    @IsOptional()
    shipping?: number;

    @IsNumber()
    @IsOptional()
    totalPrice?: number; // ฟิลด์ราคารวม
}