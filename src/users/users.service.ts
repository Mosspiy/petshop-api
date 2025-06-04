import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { CartService } from 'src/cart/cart.service';
import { FavoritesService } from 'src/favorites/favorites.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => CartService)) private cartService: CartService,
    @Inject(forwardRef(() => FavoritesService))
    private favoritesService: FavoritesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ userId: string }> {
    const user = await this.userModel
      .findOne({ lineId: createUserDto.lineId })
      .exec();

    if (user) {
      throw new NotFoundException('User already exists');
    }

    const createdUser = new this.userModel({
      lineId: createUserDto.lineId,
      displayName: createUserDto.displayName,
      pictureUrl: createUserDto.pictureUrl,
    });
    const savedUser = await createdUser.save();

    const userId = savedUser._id as Types.ObjectId;

    await this.cartService.create({ userId: userId.toString() });
    await this.favoritesService.create({ userId: userId.toString() });

    return { userId: userId.toString() };
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateUserDto, { new: true })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  async findByUserId(userId: string): Promise<User> {
    const user = await this.userModel
      .findById(userId)
      .populate([
        {
          path: 'addresses', // ชื่อฟิลด์ใน schema ของ User
          model: 'Address', // ชื่อโมเดลที่ต้องการ populate
        },
        {
          path: 'cart', // ชื่อฟิลด์ใน schema ของ User
          model: 'Cart', // ชื่อโมเดลที่ต้องการ populate
          populate: {
            path: 'items.productId', // ชื่อฟิลด์ใน schema ของ Cart
            model: 'Product', // ชื่อโมเดลที่ต้องการ populate
            select: 'name options.size options.price imageUrl', // กำหนดฟิลด์ที่ต้องการให้แสดง
          },
        },
        {
          path: 'orders',
          model: 'Order',
          populate: {
            path: 'items.productId',
            model: 'Product',
            select: 'name options.size options.price imageUrl',
          },
        },
        {
          path: 'favorites',
          model: 'Favorite',
          populate: {
            path: 'items.productId',
            model: 'Product',
            select: 'name options.size options.price imageUrl',
          },
        },
      ])
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async addAddressToUser(userId: string, addressId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $push: { addresses: addressId } }, // ใช้ `$push` เพื่อเพิ่ม ObjectId เข้าไปใน Array
      { new: true },
    );
  }

  async removeAddressFromUser(
    userId: string,
    addressId: string,
  ): Promise<boolean> {
    const haveAddress = await this.userModel
      .findOne({ _id: userId, addresses: addressId })
      .exec();

    if (!haveAddress) {
      return false;
    }

    await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { addresses: addressId } }, // ใช้ `$pull` เพื่อลบ ObjectId ออกจาก Array
      { new: true },
    );

    return true;
  }

  async addCartToUser(userId: string, cartId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { cart: cartId } }, // ใช้ $set เพื่ออัปเดต cart ด้วย cartId
      { new: true },
    );
  }

  async checkCartInUser(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      return false;
    }

    return !!user.cart;
  }

  async addFavoriteToUser(userId: string, favoriteId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { favorites: favoriteId } },
      { new: true },
    );
  }

  async addOrderToUser(userId: string, orderId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $push: { orders: orderId } },
      { new: true },
    );
  }

  async findByLineId(lineId: string): Promise<User> {
    const user = await this.userModel.findOne({ lineId }).exec();
    if (!user) {
      throw new NotFoundException(`User with LINE ID ${lineId} not found`);
    }
    return user;
  }

  async findOrCreateByLineId(data: {
    lineId: string, 
    displayName?: string, 
    pictureUrl?: string
  }): Promise<User> {
    try {
      this.logger.log(`Looking for user with LINE ID: ${data.lineId}`);
      let user = await this.userModel.findOne({ lineId: data.lineId }).exec();
      
      if (!user) {
        this.logger.log(`Creating new user with LINE ID: ${data.lineId}`);
        const createdUser = new this.userModel({
          lineId: data.lineId,
          displayName: data.displayName || 'LINE User',
          pictureUrl: data.pictureUrl
        });
        user = await createdUser.save();
    
        // สร้าง Cart และ Favorites
        const userId = user._id.toString();
        this.logger.log(`Created user with ID: ${userId}, creating cart and favorites`);
        await this.cartService.create({ userId });
        await this.favoritesService.create({ userId });
      } else {
        this.logger.log(`Found existing user with LINE ID: ${data.lineId}`);
        // อัปเดตข้อมูลผู้ใช้ถ้ามีการเปลี่ยนแปลง
        if (data.displayName !== user.displayName || data.pictureUrl !== user.pictureUrl) {
          this.logger.log(`Updating user information for LINE ID: ${data.lineId}`);
          user.displayName = data.displayName || user.displayName;
          user.pictureUrl = data.pictureUrl || user.pictureUrl;
          user = await user.save();
        }
      }
      
      if (!user) {
        throw new Error(`Failed to find or create user with LINE ID: ${data.lineId}`);
      }
      
      return user as User;
    } catch (error) {
      this.logger.error(`Error in findOrCreateByLineId: ${error.message}`);
      throw new Error(`Failed to find or create user: ${error.message}`);
    }
  }
  async findById(id: string): Promise<any> {
    try {
      // ถ้าคุณใช้ MongoDB หรือ TypeORM
      return await this.userModel.findById(id).exec();
      
      // หรือถ้าคุณใช้ Prisma
      // return await this.prisma.user.findUnique({ where: { id } });
      
      // หรือไม่ก็ปรับตามรูปแบบที่คุณใช้อยู่
    } catch (error) {
      throw new Error(`Could not find user with id ${id}: ${error.message}`);
    }
  }
}
