import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateCartDto } from './dto/create-cart.dto';
import { Cart, CartDocument } from './schemas/cart.schema';
import { UsersService } from '../users/users.service';
import { ProductsService } from 'src/products/products.service';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
    private productsService: ProductsService,
    private ordersService: OrdersService,
  ) {}

  async create(createCartDto: CreateCartDto): Promise<{ cartId: string }> {
    const createdCart = new this.cartModel(createCartDto);
    const savedCart = await createdCart.save();

    const cartId = savedCart._id as Types.ObjectId;

    await this.usersService.addCartToUser(
      createCartDto.userId,
      cartId.toString(),
    );

    return { cartId: cartId.toString() };
  }

  async addItemToCart(
    userId: string,
    productId: string,
    size: string,
  ): Promise<string> {
    const user = await this.usersService.findByUserId(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const product = await this.productsService.findOne(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const productOption = product.options.find(
      (option) => option.size === size,
    );

    if (!productOption) {
      throw new NotFoundException('Option not found');
    }

    if (productOption.stock === 0) {
      throw new NotFoundException('Product out of stock');
    }

    const [checkQuantityInCart] = await this.cartModel.aggregate([
      { $match: { _id: user.cart._id } },
      { $unwind: '$items' },
      {
        $match: {
          'items.productId': new Types.ObjectId(productId),
          'items.size': size,
        },
      },
      { $project: { _id: 0, quantity: '$items.quantity' } },
    ]);

    if (
      checkQuantityInCart &&
      checkQuantityInCart.quantity === productOption.stock
    ) {
      throw new NotFoundException('Product out of stock');
    }

    const productObjId = new Types.ObjectId(productId);
    const cartId = user.cart;
    const cart = await this.cartModel.findById(cartId).exec();

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const quantity = 1;

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.size === size,
    );

    if (itemIndex === -1) {
      cart.items.push({ productId: productObjId, size, quantity });
    } else {
      cart.items[itemIndex].quantity += quantity;
    }

    await cart.save();

    return 'Item added to cart.';
  }

  async reduceItemFromCart(
    userId: string,
    productId: string,
    size: string,
    removeAll: boolean,
  ): Promise<string> {
    const user = await this.usersService.findByUserId(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cartId = user.cart;
    const cart = await this.cartModel.findById(cartId).exec();

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.size === size,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    if (removeAll) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity -= 1;

      if (cart.items[itemIndex].quantity === 0) {
        cart.items.splice(itemIndex, 1);
      }
    }

    await cart.save();

    return 'Item removed from cart.';
  }


  async checkout(userId: string, discountAmount: number = 0): Promise<any> {
    const user = await this.usersService.findByUserId(userId);
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const Address = user.addresses.find((address: any) => address.isDefault);
  
    if (!Address) {
      throw new NotFoundException('Default address not found');
    }
  
    const cartId = user.cart;
    const cart = await this.cartModel.findById(cartId).exec();
  
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
  
    if (cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }
  
    const orderItems: { 
      productId: string; 
      size: string; 
      quantity: number; 
      price: number;  // ราคาต่อชิ้น
    }[] = [];
    
    let subtotal = 0;  // ราคาสินค้าทั้งหมดก่อนใช้ส่วนลดและค่าส่ง
    let totalQuantity = 0;
  
    // คำนวณราคาสินค้าแต่ละรายการและเก็บข้อมูล
    for (const item of cart.items) {
      const product = await this.productsService.findOne(
        item.productId.toString(),
      );
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
  
      const productOption = product.options.find(
        (option) => option.size === item.size,
      );
  
      if (!productOption) {
        throw new NotFoundException(
          `Option ${item.size} not found for product ${item.productId}`,
        );
      }
  
      const itemPrice = productOption.price;
      const itemTotalPrice = itemPrice * item.quantity;
      subtotal += itemTotalPrice;
      totalQuantity += item.quantity;
  
      orderItems.push({
        productId: item.productId.toString(),
        size: item.size,
        quantity: item.quantity,
        price: itemPrice,  // บันทึกราคาต่อชิ้น
      });
    }
  
    // เพิ่มค่าส่ง 20 บาท
    const shippingFee = 20;
    
    // ป้องกันกรณีส่วนลดติดลบ
    if (discountAmount < 0) {
      discountAmount = 0;
    }
    
    // ป้องกันส่วนลดเกินราคาสินค้า
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }
    
    // คำนวณราคาสุทธิ
    const finalPrice = subtotal + shippingFee - discountAmount;
  
    // สร้างออเดอร์
    const orderData = {
      userId,
      items: orderItems,
      subtotal,  // ราคาสินค้าทั้งหมดก่อนหักส่วนลดและค่าส่ง
      discount: discountAmount,  // จำนวนส่วนลด
      shipping: shippingFee,  // ค่าส่ง
      totalPrice: finalPrice,  // ราคาสุทธิรวมค่าส่งและหักส่วนลด
      totalQuantity,
      status: 'Pending',
      addressId: Address._id.toString(),
      orderDate: new Date(),
      isReviewed: false  // เพิ่ม isReviewed เป็น false
    };
  
    // สร้างออเดอร์
    const order = await this.ordersService.create(orderData);
  
    // ลดสต็อกสินค้า
    for (const item of orderItems) {
      try {
        await this.productsService.reduceStock(
          item.productId,
          item.size,
          item.quantity,
        );
        await this.productsService.pushPurchases(item.productId, item.quantity);
      } catch (error) {
        throw new Error(
          `Failed to reduce stock for product ${item.productId}: ${error.message}`,
        );
      }
    }
  
    // ล้างตะกร้า
    cart.items = [];
    await cart.save();
  
    return order;
  }

  async getCartByUserId(userId: string): Promise<any> {
    try {
      const user = await this.usersService.findByUserId(userId);
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      if (!user.cart) {
        return { items: [] };
      }
  
      const cartId = user.cart;
      const cart = await this.cartModel.findById(cartId).exec();
  
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
  
      // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม
      const formattedItems = await Promise.all(cart.items.map(async (item) => {
        try {
          // ดึงข้อมูลสินค้าแยกต่างหาก
          const productId = item.productId.toString();
          const product = await this.productsService.findOne(productId);
          
          if (!product) {
            throw new NotFoundException(`Product ${productId} not found`);
          }
          
          // หาข้อมูล option ที่เลือก
          const selectedOption = product.options.find(opt => opt.size === item.size);
          
          return {
            productId: productId,
            name: product.name,
            description: product.description,
            size: item.size,
            price: selectedOption ? selectedOption.price : 0,
            quantity: item.quantity,
            imageUrl: product.imageUrl
          };
        } catch (error) {
          console.error(`Error formatting cart item:`, error);
          return null;
        }
      }));
  
      return {
        items: formattedItems.filter(item => item !== null)
      };
    } catch (error) {
      console.error(`Error getting cart by userId ${userId}:`, error);
      throw error;
    }
  }
}