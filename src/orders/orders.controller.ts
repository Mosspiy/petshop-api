import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.ordersService.findAll(status);
  }

  @Get(':orderId')
  findOne(@Param('orderId') orderId: string) {
    return this.ordersService.findOne(orderId);
  }

  @Get('code/:orderCode')
  findByOrderCode(@Param('orderCode') orderCode: string) {
    return this.ordersService.findByOrderCode(orderCode);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.ordersService.findByUserId(userId);
  }

  @Patch(':orderId')
  update(@Param('orderId') orderId: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(orderId, updateOrderDto);
  }

  @Patch(':orderId/tracking')
  updateTracking(
    @Param('orderId') orderId: string,
    @Body() tracking: { trackingNumber: string },
  ) {
    const updateData: UpdateOrderDto = {
      trackingNumber: tracking.trackingNumber,
      status: 'Shipped' // อัปเดตสถานะเป็น Shipped โดยอัตโนมัติ
    };
    
    return this.ordersService.update(orderId, updateData);
  }

  @Delete(':orderId')
  remove(@Param('orderId') orderId: string) {
    return this.ordersService.remove(orderId);
  }
}