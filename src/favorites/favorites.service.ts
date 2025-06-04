import { Injectable, NotFoundException, Inject, forwardRef, Logger, InternalServerErrorException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';
import { UsersService } from 'src/users/users.service';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
    private productsService: ProductsService,
  ) {}

  // ค้นหา Favorite โดยใช้ ID
  async findById(favoriteId: string): Promise<any> {
    const favorite = await this.favoriteModel.findById(favoriteId)
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'name description imageUrl options status'
      });
  
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
  
    return favorite;
  }

  // ค้นหา Favorite โดยใช้ userId
  async findByUserId(userId: string): Promise<any> {
    const favorite = await this.favoriteModel.findOne({ userId })
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'name description imageUrl options status'
      });
  
    if (!favorite) {
      throw new NotFoundException(`Favorite not found for user ${userId}`);
    }
  
    return favorite;
  }

  // สร้าง Favorite ใหม่
  async create(createFavoriteDto: CreateFavoriteDto): Promise<void> {
    try {
      const user = await this.usersService.findByUserId(createFavoriteDto.userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const favorite = await this.favoriteModel.findOne({
        userId: createFavoriteDto.userId
      });

      if (favorite) {
        throw new NotFoundException('Favorite already exists');
      }

      const createdFavorite = new this.favoriteModel({
        userId: new Types.ObjectId(createFavoriteDto.userId),
        items: []
      });
      
      const savedFavorite = await createdFavorite.save();
      const favoriteId = savedFavorite._id as Types.ObjectId;

      await this.usersService.addFavoriteToUser(
        createFavoriteDto.userId,
        favoriteId.toString(),
      );
    } catch (error) {
      this.logger.error(`Failed to create favorite: ${error.message}`);
      throw error;
    }
  }

  // เพิ่มสินค้าเข้า Favorite โดยใช้ favoriteId
  async addItemsToFavorite(favoriteId: string, productId: string, userId?: string): Promise<string> {
    const favorite = await this.favoriteModel.findById(favoriteId);
  
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
  
    // ถ้ามี userId จาก request และ favorite ไม่มี userId ให้อัปเดต
    if (userId && !favorite.userId) {
      this.logger.log(`Updating userId for favorite ${favoriteId}`);
      favorite.userId = new Types.ObjectId(userId);
    }
  
    const product = await this.productsService.findOne(productId);
  
    if (!product) {
      throw new NotFoundException('Product not found');
    }
  
    if (favorite.items.some(item => item.productId.toString() === productId)) {
      return 'Item already exists in favorite';
    }
  
    const productIdObject = new Types.ObjectId(productId);
  
    favorite.items.push({ productId: productIdObject });
  
    try {
      await favorite.save();
      return 'Item added to favorite';
    } catch (error) {
      this.logger.error(`Error saving favorite: ${error.message}`);
      
      // ถ้าเกิด validation error เกี่ยวกับ userId
      if (error.message && error.message.includes('userId')) {
        // ลองใช้วิธีอัปเดตแทนการ save
        await this.favoriteModel.updateOne(
          { _id: favoriteId },
          { $push: { items: { productId: productIdObject } } }
        );
        return 'Item added to favorite (using update)';
      }
      
      throw error;
    }
  }

  // เพิ่มสินค้าเข้า Favorite โดยใช้ userId
  async addItemsToFavoriteByUserId(userId: string, productId: string): Promise<string> {
    try {
      const favorite = await this.favoriteModel.findOne({ userId });

      if (!favorite) {
        throw new NotFoundException(`Favorite not found for user ${userId}`);
      }

      const product = await this.productsService.findOne(productId);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (favorite.items.some(item => item.productId.toString() === productId)) {
        return 'Item already exists in favorite';
      }

      const productIdObject = new Types.ObjectId(productId);

      favorite.items.push({ productId: productIdObject });

      await favorite.save();

      return 'Item added to favorite';
    } catch (error) {
      this.logger.error(`Failed to add item to favorite: ${error.message}`);
      throw error;
    }
  }

  // ลบสินค้าออกจาก Favorite โดยใช้ favoriteId
  async removeItemsFromFavorite(favoriteId: string, productId: string, userId?: string): Promise<string> {
    const favorite = await this.favoriteModel.findById(favoriteId);
  
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
  
    // ถ้ามี userId จาก request และ favorite ไม่มี userId ให้อัปเดต
    if (userId && !favorite.userId) {
      this.logger.log(`Updating userId for favorite ${favoriteId}`);
      favorite.userId = new Types.ObjectId(userId);
    }
  
    try {
      // ตรวจสอบว่ามีสินค้าหรือไม่
      const product = await this.productsService.findOne(productId);
      if (!product) {
        throw new NotFoundException('Product not found');
      }
  
      // กรองรายการที่ไม่ตรงกับ productId ออก
      favorite.items = favorite.items.filter(item => item.productId.toString() !== productId);
  
      // บันทึกข้อมูล
      await favorite.save();
  
      return 'Item removed from favorite';
    } catch (error) {
      this.logger.error(`Error removing item from favorite: ${error.message}`);
      
      // ถ้าเกิด validation error
      if (error.message && error.message.includes('validation')) {
        // ลองใช้วิธี updateOne แทนการ save
        await this.favoriteModel.updateOne(
          { _id: favoriteId },
          { $pull: { items: { productId: new Types.ObjectId(productId) } } }
        );
        return 'Item removed from favorite (using update)';
      }
      
      throw error;
    }
  }
  async forceRemoveItemFromFavorite(favoriteId: string, productId: string): Promise<any> {
    try {
      const result = await this.favoriteModel.updateOne(
        { _id: favoriteId },
        { $pull: { items: { productId: new Types.ObjectId(productId) } } }
      );
      
      if (result.modifiedCount > 0) {
        return { message: 'Item removed from favorite (force)' };
      } else {
        return { message: 'No items were removed (force)' };
      }
    } catch (error) {
      this.logger.error(`Error force removing item: ${error.message}`);
      throw new InternalServerErrorException('Failed to remove item from favorite');
    }
  }

  // ลบสินค้าออกจาก Favorite โดยใช้ userId
  async removeItemsFromFavoriteByUserId(userId: string, productId: string): Promise<string> {
    try {
      const favorite = await this.favoriteModel.findOne({ userId });

      if (!favorite) {
        throw new NotFoundException(`Favorite not found for user ${userId}`);
      }

      const product = await this.productsService.findOne(productId);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      favorite.items = favorite.items.filter(item => item.productId.toString() !== productId);

      await favorite.save();

      return 'Item removed from favorite';
    } catch (error) {
      this.logger.error(`Failed to remove item from favorite: ${error.message}`);
      throw error;
    }
  }
  
  // ตรวจสอบว่าสินค้าอยู่ใน Favorite หรือไม่โดยใช้ userId
  async checkItemInFavorite(userId: string, productId: string): Promise<{ isInFavorite: boolean }> {
    try {
      const favorite = await this.favoriteModel.findOne({ userId });

      if (!favorite) {
        return { isInFavorite: false };
      }

      const isInFavorite = favorite.items.some(item => item.productId.toString() === productId);

      return { isInFavorite };
    } catch (error) {
      this.logger.error(`Failed to check item in favorite: ${error.message}`);
      throw error;
    }
  }
  
}