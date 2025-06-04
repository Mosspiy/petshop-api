import { Injectable } from '@nestjs/common';
import axios from 'axios';

// กำหนด Interface สำหรับ Response
interface LineTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface LineProfileResponse {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

@Injectable()
export class LineService {
  async exchangeToken(code: string): Promise<string> {
    try {
      const response = await axios.post<LineTokenResponse>(
        'https://api.line.me/oauth2/v2.1/token',
        new URLSearchParams([
          ['grant_type', 'authorization_code'],
          ['code', code],
          ['client_id', process.env.LINE_CHANNEL_ID || ''],
          ['client_secret', process.env.LINE_CHANNEL_SECRET || ''],
          ['redirect_uri', process.env.LINE_CALLBACK_URL || '']
        ]),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Error exchanging token:', error);
      throw error;
    }
  }

  async getUserProfile(accessToken: string): Promise<LineProfileResponse> {
    try {
      const response = await axios.get<LineProfileResponse>('https://api.line.me/v2/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return {
        userId: response.data.userId,
        displayName: response.data.displayName,
        pictureUrl: response.data.pictureUrl
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }
}