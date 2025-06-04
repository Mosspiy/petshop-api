import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService
  ) {}

  // ปรับเปลี่ยนเป็นการสร้าง mock user ชั่วคราว
  async validateUser(lineId: string, profile: any) {
    try {
      // หาผู้ใช้ด้วย Line ID
      const user = await this.usersService.findByLineId(lineId);
      return user || this.usersService.create({
        lineId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl
      });
    } catch (error) {
      // สร้าง mock user
      return {
        _id: 'mock-user-id',
        lineId,
        displayName: profile?.displayName || 'Mock User',
        pictureUrl: profile?.pictureUrl || null,
      };
    }
  }

  // สร้าง JWT Token
  generateToken(user: any) {
    const payload = { 
      sub: user._id, 
      lineId: user.lineId,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl
    };
    return this.jwtService.sign(payload);
  }

  // Validate JWT Token
  async validateToken(token: string) {
    try {
      const result = this.jwtService.verify(token);
      console.log('Token verification result:', result);
      return result; // ควรจะคืนค่า payload โดยตรง ไม่ใช่ Promise
    } catch (error) {
      console.error('Token verification error:', error.message);
      return null;
    }
  }
}