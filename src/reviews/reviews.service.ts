import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review, ReviewDocument } from './schemas/review.schema';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private ordersService: OrdersService
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    try {
      // สร้างรีวิวใหม่
      console.log('Creating review with DTO:', createReviewDto);
      
      // สร้าง object ใหม่เพื่อเพิ่ม userId หากไม่มี
      const reviewData = {
        ...createReviewDto,
        // กำหนด ID ที่ถูกต้อง (เป็น ObjectId ที่ใช้ได้จริง หรือใช้ ID ของ user test ในระบบ)
        userId: createReviewDto.userId || '65f09fdfe6ce14bc1292aeb6'  // ใช้ ObjectId ที่มีอยู่จริงในระบบของคุณ
      };
      
      const createdReview = new this.reviewModel(reviewData);
      const savedReview = await createdReview.save();
      
      // อัปเดตสถานะการรีวิวของออเดอร์
      try {
        await this.ordersService.update(createReviewDto.orderId, { 
          isReviewed: true 
        });
      } catch (updateError) {
        console.error('Error updating order status:', updateError);
      }
      
      return savedReview;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  async findAll(): Promise<Review[]> {
    return this.reviewModel.find()
      .populate('userId', 'name email profile')
      .populate('orderId')
      .exec();
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewModel.findById(id)
      .populate('userId', 'name email profile')
      .populate('orderId')
      .exec();
      
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    
    return review;
  }

  async findByUserId(userId: string): Promise<Review[]> {
    return this.reviewModel.find({ userId })
      .populate('orderId')
      .exec();
  }

  async findByOrderId(orderId: string): Promise<Review> {
    try {
      const review = await this.reviewModel.findOne({ orderId })
        .populate('userId', 'name email profile')
        .exec();
        
      if (!review) {
        throw new NotFoundException(`Review for order ${orderId} not found`);
      }
      
      return review;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error finding review for order ${orderId}:`, error);
      throw new Error('Failed to fetch review');
    }
  }
}