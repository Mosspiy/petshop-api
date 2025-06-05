import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AddressesModule } from './addresses/addresses.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal:true }),
    MongooseModule.forRoot('mongodb+srv://mosspiyawat:JAihPRCtl0qOFczV@petshop.jtwpsjm.mongodb.net/?retryWrites=true&w=majority&appName=petshop'),
  ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'uploads'),
    serveRoot: '/uploads/'
  }), ProductsModule, UsersModule, AddressesModule, CartModule, OrdersModule, FavoritesModule, AuthModule, ReviewsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
