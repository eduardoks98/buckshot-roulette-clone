// ==========================================
// OAUTH CONTROLLER
// ==========================================

import { Request, Response } from 'express';
import { env } from '../config/env.config';
import { authService } from '../services/auth.service';
import prisma from '../lib/prisma';

interface TokenResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    display_name: string;
    nickname?: string;
    avatar_url?: string;
    is_admin: boolean;
    is_banned: boolean;
  };
  error?: string;
  error_description?: string;
}

/**
 * Exchange authorization code for user data
 * POST /api/oauth/callback
 *
 * Body:
 * - code: Authorization code from Portal
 * - code_verifier: PKCE verifier
 * - redirect_uri: Must match the original
 */
export const exchangeCode = async (req: Request, res: Response) => {
  try {
    const { code, code_verifier, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    console.log('[OAuth] Exchanging code for user data');

    // Call Portal's token endpoint
    const tokenUrl = env.OAUTH_TOKEN_URL;
    const clientId = env.OAUTH_CLIENT_ID;
    const clientSecret = env.OAUTH_CLIENT_SECRET;

    // Create Basic Auth header
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirect_uri || env.OAUTH_REDIRECT_URI,
        code_verifier: code_verifier || '',
      }),
    });

    const data = await response.json() as TokenResponse;

    if (!response.ok || !data.success || !data.user) {
      console.error('[OAuth] Token exchange failed:', data);
      return res.status(401).json({
        error: data.error || 'token_exchange_failed',
        error_description: data.error_description || 'Failed to exchange code for user data',
      });
    }

    console.log('[OAuth] User data received:', { id: data.user.id, email: data.user.email });

    // Check if user is banned
    if (data.user.is_banned) {
      return res.status(403).json({
        error: 'user_banned',
        error_description: 'Your account has been banned',
      });
    }

    // Find or create user locally
    let user = await prisma.user.findFirst({
      where: { game_user_id: data.user.id },
    });

    if (!user) {
      // Try to find by email
      user = await prisma.user.findUnique({
        where: { email: data.user.email },
      });

      if (user) {
        // Update existing user with game_user_id
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            game_user_id: data.user.id,
            display_name: data.user.display_name || data.user.nickname || data.user.username,
            avatar_url: data.user.avatar_url,
            is_admin: data.user.is_admin,
            last_login_at: new Date(),
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            game_user_id: data.user.id,
            email: data.user.email,
            username: data.user.username,
            display_name: data.user.display_name || data.user.nickname || data.user.username,
            avatar_url: data.user.avatar_url,
            is_admin: data.user.is_admin,
            last_login_at: new Date(),
          },
        });
      }
    } else {
      // Update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          display_name: data.user.display_name || data.user.nickname || user.display_name,
          avatar_url: data.user.avatar_url || user.avatar_url,
          is_admin: data.user.is_admin,
          last_login_at: new Date(),
        },
      });
    }

    // Create local session
    const { token } = await authService.createSession(user.id);

    console.log('[OAuth] Session created for user:', user.id);

    // Get user profile
    const profile = await authService.getUserProfile(user.id);

    res.json({
      success: true,
      token,
      user: profile,
    });
  } catch (error) {
    console.error('[OAuth] Error exchanging code:', error);
    res.status(500).json({
      error: 'internal_error',
      error_description: 'An error occurred during authentication',
    });
  }
};
