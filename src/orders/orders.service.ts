import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private productsService: ProductsService,
  ) {}

  // ฟังก์ชันสร้างรหัสออเดอร์แบบง่าย: ORD00001, ORD00002, ...
  async generateOrderCode(): Promise<string> {
    try {
      console.log('Generating new order code...');
      
      // หาออเดอร์ล่าสุด
      const latestOrder = await this.orderModel.findOne()
        .sort({ createdAt: -1, _id: -1 })
        .exec();
      
      console.log('Latest order:', latestOrder);
      
      let orderNumber = 1; // เริ่มที่ 1 ถ้าไม่มีออเดอร์ก่อนหน้า
      
      if (latestOrder && latestOrder.orderCode) {
        // ถ้ามีออเดอร์ก่อนหน้า ให้ดึงตัวเลขจากรหัสออเดอร์ล่าสุด
        const latestOrderCode = latestOrder.orderCode;
        console.log('Latest order code:', latestOrderCode);
        
        // ถ้ามีรหัสในรูปแบบ ORDxxxxx ให้ดึงตัวเลขออกมา
        if (latestOrderCode.startsWith('ORD')) {
          const numStr = latestOrderCode.substring(3); // ตัด 'ORD' ออก
          const num = parseInt(numStr, 10);
          
          if (!isNaN(num)) {
            orderNumber = num + 1; // เพิ่มอีก 1
            console.log('Incremented order number:', orderNumber);
          }
        }
      } else {
        console.log('No previous orders found, starting with 1');
      }
      
      // สร้างรหัสใหม่ในรูปแบบ ORDxxxxx (เช่น ORD00001, ORD00002)
      const paddedNumber = orderNumber.toString().padStart(5, '0');
      const newOrderCode = `ORD${paddedNumber}`;
      
      console.log(`Generated new order code: ${newOrderCode}`);
      
      return newOrderCode;
    } catch (error) {
      console.error('Error generating order code:', error);
      // ในกรณีที่มีข้อผิดพลาด ให้ใช้รหัสพร้อม timestamp
      const timestamp = Date.now();
      return `ORD${timestamp}`;
    }
  }

  // สร้างออเดอร์ใหม่
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      console.log('Creating new order...');
      
      // สร้างรหัสออเดอร์
      const orderCode = await this.generateOrderCode();
      console.log('Generated order code:', orderCode);
      
      // คำนวณ subtotal จากรายการสินค้า (ถ้ายังไม่มีค่า)
      let subtotal = createOrderDto.subtotal;
      if (subtotal === undefined) {
        subtotal = createOrderDto.items.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);
      }
      
      // ค่าส่ง (default คือ 20)
      const shipping = createOrderDto.shipping || 20;
      
      // ส่วนลด
      const discount = createOrderDto.discount || 0;
      
      // เพิ่ม orderCode และข้อมูลราคาเข้าไปใน DTO
      const orderData = {
        ...createOrderDto,
        orderCode,
        subtotal,
        shipping,
        discount,
        isReviewed: false // ตั้งค่าเริ่มต้นให้ยังไม่มีการรีวิว
      };
      
      console.log('Saving order with data:', orderData);
      
      const createdOrder = new this.orderModel(orderData);
      const savedOrder = await createdOrder.save();
      
      console.log('Order saved successfully:', savedOrder);
      
      return savedOrder;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw error;
    }
  }

  // คืนสินค้าเข้าสต็อกเมื่อยกเลิกออเดอร์
  async restoreStock(orderId: string): Promise<void> {
    try {
      // ดึงข้อมูลออเดอร์
      const order = await this.orderModel.findById(orderId).exec();
      
      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }
      
      // ตรวจสอบว่าออเดอร์นั้นยกเลิกแล้ว (สถานะเป็น 'Cancelled')
      if (order.status !== 'Cancelled') {
        throw new BadRequestException(`Cannot restore stock for order with status ${order.status}. Order must be cancelled.`);
      }
      
      // คืนสต็อกสินค้า
      for (const item of order.items) {
        try {
          await this.productsService.restoreStock(
            item.productId.toString(),
            item.size,
            item.quantity
          );
          
          this.logger.log(`Restored ${item.quantity} of product ${item.productId} (${item.size}) to stock`);
        } catch (error) {
          this.logger.error(`Failed to restore stock for product ${item.productId}: ${error.message}`);
          // ทำต่อไปกับสินค้ารายการถัดไป ไม่ throw error ที่นี่
        }
      }
      
      this.logger.log(`Stocks restored for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to restore stock for order ${orderId}: ${error.message}`);
      throw error; // ส่งต่อ error ไปให้ controller จัดการ
    }
  }

  // ค้นหาออเดอร์ทั้งหมด (เพิ่มพารามิเตอร์ status เพื่อกรองตามสถานะ)
  async findAll(status?: string): Promise<Order[]> {
    try {
      let query = {};
      
      // ถ้ามีพารามิเตอร์ status ให้กรองตามสถานะ
      if (status) {
        query = { status };
      }
      
      return this.orderModel.find(query)
        .sort({ orderDate: -1 }) // เรียงตามวันที่ล่าสุด
        .populate({
          path: 'userId',
          select: 'name email profile'
        })
        .populate({
          path: 'addressId',
          select: 'name lastname phone address district province zipCode'
        })
        .populate({
          path: 'items.productId',
          select: 'name description imageUrl options status'
        })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to find orders: ${error.message}`);
      throw error;
    }
  }

  // ค้นหาออเดอร์ตาม ID
  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id)
      .populate({
        path: 'userId',
        select: 'name email profile'
      })
      .populate({
        path: 'addressId',
        select: 'name lastname phone address district province zipCode'
      })
      .populate({
        path: 'items.productId',
        select: 'name description imageUrl options status'
      })
      .exec();
    
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  // ค้นหาออเดอร์ตามรหัสออเดอร์
  async findByOrderCode(orderCode: string): Promise<Order> {
    const order = await this.orderModel.findOne({ orderCode })
      .populate({
        path: 'userId',
        select: 'name email profile'
      })
      .populate({
        path: 'addressId',
        select: 'name lastname phone address district province zipCode'
      })
      .populate({
        path: 'items.productId',
        select: 'name description imageUrl options status'
      })
      .exec();
      
    if (!order) {
      throw new NotFoundException(`Order with code ${orderCode} not found`);
    }
    return order;
  }

  // ค้นหาออเดอร์ของผู้ใช้
  async findByUserId(userId: string): Promise<Order[]> {
    return this.orderModel.find({ userId })
      .populate({
        path: 'addressId',
        select: 'name lastname phone address district province zipCode'
      })
      .populate({
        path: 'items.productId',
        select: 'name description imageUrl options status'
      })
      .sort({ orderDate: -1 })
      .exec();
  }

  // อัพเดทออเดอร์
  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      // ดึงข้อมูลออเดอร์เดิม
      const existingOrder = await this.orderModel.findById(id).exec();
      
      if (!existingOrder) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      
      // ตรวจสอบว่าออเดอร์เดิมเป็น Cancelled หรือไม่
      if (existingOrder.status === 'Cancelled' && updateOrderDto.status && updateOrderDto.status !== 'Cancelled') {
        throw new BadRequestException('ไม่สามารถเปลี่ยนสถานะได้ เนื่องจากออเดอร์นี้ถูกยกเลิกไปแล้ว');
      }
      
      // เตรียมข้อมูลที่จะอัปเดต
      const updateData: any = { ...updateOrderDto };
      
      // แปลงค่า discount ให้เป็นตัวเลขเสมอ ถ้ามีการส่งมา
      if (updateOrderDto.discount !== undefined) {
        updateData.discount = typeof updateOrderDto.discount === 'string' 
          ? parseFloat(updateOrderDto.discount) 
          : updateOrderDto.discount;
      }
      
      // คำนวณราคารวมใหม่ถ้ามีการเปลี่ยนแปลงส่วนลด
      if (updateData.discount !== undefined && updateData.totalPrice === undefined) {
        // คำนวณยอดรวมสุทธิหลังหักส่วนลด
        const subtotal = existingOrder.subtotal || existingOrder.items.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);
        
        const shipping = existingOrder.shipping || 20;
        
        // อัปเดตยอดรวม
        updateData.totalPrice = subtotal + shipping - updateData.discount;
      }
      
      // ตรวจสอบว่ามีการเปลี่ยนสถานะเป็น 'Cancelled' หรือไม่
      const statusChangedToCancelled = 
        updateOrderDto.status === 'Cancelled' && 
        existingOrder.status !== 'Cancelled';
      
      // ทำการอัปเดตข้อมูล
      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate({
          path: 'userId',
          select: 'name email profile'
        })
        .populate({
          path: 'addressId',
          select: 'name lastname phone address district province zipCode'
        })
        .populate({
          path: 'items.productId',
          select: 'name description imageUrl options status'
        })
        .exec();
      
      if (!updatedOrder) {
        throw new NotFoundException(`Order with ID ${id} not found after update`);
      }
      
      // ถ้าสถานะเปลี่ยนเป็น 'Cancelled' ให้คืนสินค้าเข้าสต็อก
      if (statusChangedToCancelled) {
        try {
          await this.restoreStock(id);
        } catch (restoreError) {
          this.logger.error(`Failed to restore stock for cancelled order ${id}: ${restoreError.message}`);
          // ไม่ throw error ออกไป เพราะการอัปเดตออเดอร์สำเร็จแล้ว
        }
      }
      
      return updatedOrder;
    } catch (error) {
      this.logger.error(`Failed to update order: ${error.message}`);
      throw error;
    }
  }

  // ลบออเดอร์
  async remove(id: string): Promise<void> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }
}