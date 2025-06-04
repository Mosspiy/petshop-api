import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // เพิ่ม endpoint นี้เพื่อดึงข้อมูลตะกร้า
  @Get(':userId')
  async getCart(@Param('userId') userId: string) {
    return this.cartService.getCartByUserId(userId);
  }
  
  @Post(':userId/add')
  async addItemToCart(
    @Param('userId') userId: string,
    @Body('productId') productId: string,
    @Body('size') size: string, 
  ) {
    return this.cartService.addItemToCart(userId, productId, size);
  }

  @Post(':userId/reduce')
  async removeItemFromCart(
    @Param('userId') userId: string,
    @Body() body: { productId: string, size: string, removeAll: boolean }
  ) {
    return this.cartService.reduceItemFromCart(userId, body.productId, body.size, body.removeAll);
  }

  @Post(':userId/checkout')
  async checkOut(
    @Param('userId') userId: string,
    @Body('discount') discount: number = 0
  ) {
    return this.cartService.checkout(userId, discount);
  }
}