import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  InternalServerErrorException,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { Types } from 'mongoose';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // จัดเรียง route ให้พิเศษก่อน
  // ======= User Routes ========
  // ดึงข้อมูล Favorite โดยใช้ userId
  @Get('user/:userId')
  async getFavoriteByUserId(@Param('userId') userId: string) {
    return this.favoritesService.findByUserId(userId);
  }

  // เพิ่มสินค้าเข้า Favorite โดยใช้ userId
  @Post('user/:userId/add')
  addItemToFavoriteByUserId(
    @Param('userId') userId: string,
    @Body('productId') productId: string,
  ) {
    return this.favoritesService.addItemsToFavoriteByUserId(userId, productId);
  }

  // ลบสินค้าออกจาก Favorite โดยใช้ userId
  @Post('user/:userId/remove')
  removeItemFromFavoriteByUserId(
    @Param('userId') userId: string,
    @Body('productId') productId: string,
  ) {
    return this.favoritesService.removeItemsFromFavoriteByUserId(userId, productId);
  }

  // ตรวจสอบว่าสินค้าอยู่ใน Favorite หรือไม่โดยใช้ userId
  @Get('user/:userId/check/:productId')
  checkItemInFavorite(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.favoritesService.checkItemInFavorite(userId, productId);
  }

  // ======= Favorite ID Routes ========
  // ดึงข้อมูล Favorite โดยใช้ favoriteId
  @Get(':favoriteId')
  async getFavoriteById(@Param('favoriteId') favoriteId: string) {
    return this.favoritesService.findById(favoriteId);
  }

  // เพิ่มสินค้าเข้า Favorite โดยใช้ favoriteId
  @Post(':favoriteId/add')
  addItemToFavorite(
    @Param('favoriteId') favoriteId: string,
    @Body('productId') productId: string,
    @Body('userId') userId?: string,
  ) {
    return this.favoritesService.addItemsToFavorite(favoriteId, productId, userId);
  }

  // ลบสินค้าออกจาก Favorite โดยใช้ favoriteId
  @Post(':favoriteId/remove')
  removeItemFromFavorite(
    @Param('favoriteId') favoriteId: string,
    @Body('productId') productId: string,
    @Body('userId') userId?: string,
  ) {
    return this.favoritesService.removeItemsFromFavorite(favoriteId, productId, userId);
  }

  // ลบสินค้าออกจาก Favorite แบบบังคับ
  @Post(':favoriteId/force-remove')
  async forceRemoveItemFromFavorite(
    @Param('favoriteId') favoriteId: string,
    @Body('productId') productId: string,
  ) {
    return this.favoritesService.forceRemoveItemFromFavorite(favoriteId, productId);
  }
}