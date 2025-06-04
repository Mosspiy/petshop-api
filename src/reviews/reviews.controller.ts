import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Request
  } from '@nestjs/common';
  import { ReviewsService } from './reviews.service';
  import { CreateReviewDto } from './dto/create-review.dto';
  
  @Controller('reviews')
  export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}
  
    @Post()
    create(@Body() createReviewDto: CreateReviewDto) {
      // เพิ่ม console.log เพื่อดูข้อมูลที่รับมา
      console.log('Creating review with data:', createReviewDto);
      return this.reviewsService.create(createReviewDto);
    }
  
    @Get()
    findAll() {
      return this.reviewsService.findAll();
    }
  
    // ย้าย route แบบเฉพาะเจาะจงมาก่อน route ที่ใช้ parameter
    @Get('user/:userId')
    findByUser(@Param('userId') userId: string) {
      return this.reviewsService.findByUserId(userId);
    }
  
    @Get('order/:orderId')
    findByOrder(@Param('orderId') orderId: string) {
      return this.reviewsService.findByOrderId(orderId);
    }
  
    // ย้าย route แบบ parameter มาเป็นอันสุดท้าย
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.reviewsService.findOne(id);
    }
  }