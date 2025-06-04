import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-line';
import { AuthService } from '../auth.service';

@Injectable()
export class LineStrategy extends PassportStrategy(Strategy, 'line') {
  private readonly logger = new Logger(LineStrategy.name);

  constructor(private authService: AuthService) {
    super({
      channelID: process.env.LINE_CHANNEL_ID,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
      callbackURL: process.env.LINE_CALLBACK_URL,
      scope: ['profile', 'openid']
    });
    
    this.logger.log('LINE Strategy initialized');
  }

  async validate(accessToken, refreshToken, profile, done) {
    try {
      this.logger.log('LINE profile received: ' + JSON.stringify(profile));
      
      const user = {
        lineId: profile.id,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl
      };
      
      const savedUser = await this.authService.validateUser(user.lineId, user);
      return done(null, savedUser);
    } catch (error) {
      this.logger.error('LINE validation error: ' + error.message);
      return done(error, false);
    }
  }
}