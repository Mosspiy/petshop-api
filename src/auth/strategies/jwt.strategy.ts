import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    // ใช้ secret key ที่แน่นอนสำหรับการทดสอบ
    const secret = 'your-secret-key';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
    
    this.logger.log('JWT Strategy initialized with fixed secret');
  }

  async validate(payload: any) {
    return { 
      id: payload.sub,
      lineId: payload.lineId,
      displayName: payload.displayName, // เพิ่ม displayName
      pictureUrl: payload.pictureUrl    // เพิ่ม pictureUrl
    };
  }
}