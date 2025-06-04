import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CustomerProductsController } from './products.controller'; // ตรวจสอบ import
import { Product, ProductSchema } from './schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const filename = `${Date.now()}-${file.originalname}`;
          callback(null, filename);
        },
      }),
    }),
  ],
  controllers: [
    ProductsController, 
    CustomerProductsController // ตรวจสอบว่ามี controller นี้
  ],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}