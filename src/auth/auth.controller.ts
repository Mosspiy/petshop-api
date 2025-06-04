import { Controller, Get, Req, Res, UseGuards, Post, Body, Headers, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LineService } from './line.service';
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly lineService: LineService
  ) {}


  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
getProfile(@Req() req) {
  return {
    id: req.user.id,
    lineId: req.user.lineId,
    displayName: req.user.displayName || 'ผู้ใช้',
    pictureUrl: req.user.pictureUrl || null
  };
}

  @Get('verify-token')
  async verifyToken(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'No token provided or invalid format' };
    }
    
    const token = authHeader.substring(7);
    try {
      const decoded = await this.authService.validateToken(token);
      console.log('Decoded token directly:', decoded);
      
      return { 
        valid: !!decoded, 
        payload: decoded || {},
        token: token.substring(0, 20) + '...'
      };
    } catch (error) {
      return { 
        valid: false, 
        error: error.message,
        token: token.substring(0, 20) + '...'
      };
    }
  }

  @Get('test-auth')
  @UseGuards(AuthGuard('jwt'))
  testAuth() {
    return { message: 'You are authenticated!' };
  }

  @Get('simple-auth')
  @UseGuards(AuthGuard('jwt'))
  simpleAuth() {
    console.log('Simple auth endpoint called');
    return { 
      message: 'Authentication successful', 
      timestamp: new Date().toISOString() 
    };
  }

  // เพิ่ม Line login endpoints
  @Get('line')
  lineLogin() {
    this.logger.log('Initiating LINE login...');
    
    // สร้าง URL สำหรับ LINE Login
    const state = Math.random().toString(36).substring(2, 15);
    const lineLoginUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
    lineLoginUrl.searchParams.append('response_type', 'code');
    lineLoginUrl.searchParams.append('client_id', process.env.LINE_CHANNEL_ID || '');
    lineLoginUrl.searchParams.append('redirect_uri', process.env.LINE_CALLBACK_URL || '');
    lineLoginUrl.searchParams.append('state', state);
    lineLoginUrl.searchParams.append('scope', 'profile openid');
    
    // Redirect ไปยัง LINE Login page
    return { url: lineLoginUrl.toString() };
  }

  @Get('line/callback')
  async lineLoginCallback(@Req() req, @Res() res) {
    try {
      this.logger.log('Received LINE callback');
      
      // รับ code จาก query parameters
      const code = req.query.code;
      
      if (!code) {
        throw new UnauthorizedException('No authorization code provided');
      }
      
      // แลกเปลี่ยน code เป็น access token
      const lineToken = await this.lineService.exchangeToken(code);
      
      // ดึงข้อมูลผู้ใช้จาก LINE
      const lineProfile = await this.lineService.getUserProfile(lineToken);
      
      this.logger.log(`LINE profile received: ${JSON.stringify(lineProfile)}`);
      
      // ค้นหาหรือสร้างผู้ใช้ในฐานข้อมูล
      const user = await this.usersService.findOrCreateByLineId({
        lineId: lineProfile.userId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl
      });
      
      // สร้าง JWT token
      const token = this.authService.generateToken(user);
      
      // Redirect กลับไปยัง frontend พร้อม token
      const frontendUrl = process.env.FRONTEND_URL;
      const redirectUrl = `${frontendUrl}/login-success?token=${token}`;
      
      this.logger.log(`Redirecting to: ${redirectUrl}`);
      res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error(`LINE login callback error: ${error.message}`);
      
      // Redirect ไปยังหน้า error ใน frontend 
      const frontendUrl = process.env.FRONTEND_URL;
      const errorMessage = encodeURIComponent(error.message || 'LINE Login Failed');
      res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
    }
  }

  @Get('test-token')
  getTestToken() {
    const testUser = {
      _id: 'test-user-id',
      lineId: 'test-line-id',
      displayName: 'Test User'
    };
    
    const token = this.authService.generateToken(testUser);
    
    return {
      message: 'Test token generated',
      token,
      user: testUser
    };
  }

  @Get('debug')
  debug(@Headers() headers) {
    return {
      message: 'Debug information',
      headers: {
        authorization: headers.authorization ? 'Present' : 'Missing',
        authType: headers.authorization?.split(' ')[0] || 'None',
        contentType: headers['content-type'] || 'None'
      },
      timestamp: new Date().toISOString(),
      env: {
        lineChannelId: process.env.LINE_CHANNEL_ID ? 'Set' : 'Not set',
        lineChannelSecret: process.env.LINE_CHANNEL_SECRET ? 'Set' : 'Not set',
        lineCallbackUrl: process.env.LINE_CALLBACK_URL || 'Not set',
        jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
      }
    };
  }
  @Post('line/token')
  async handleLineLogin(@Body() body: { code: string }) {
    try {
      this.logger.log('Processing LINE token exchange');
      const lineToken = await this.lineService.exchangeToken(body.code);
      const lineProfile = await this.lineService.getUserProfile(lineToken);

      this.logger.log(`LINE profile received: ${JSON.stringify(lineProfile)}`);
      
      const user = await this.usersService.findOrCreateByLineId({
        lineId: lineProfile.userId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl
      });

      const token = this.authService.generateToken(user);

      return {
        token,
        user: {
          id: user._id, 
          lineId: user.lineId,
          displayName: user.displayName,
          pictureUrl: user.pictureUrl
        }
      };
    } catch (error) {
      this.logger.error(`LINE login failed: ${error.message}`);
      throw new UnauthorizedException('LINE Login Failed');
    }
  }
  
}