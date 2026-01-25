// ==========================================
// PASSPORT CONFIGURATION - Google OAuth
// ==========================================

import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './env.config';
import prisma from '../lib/prisma';

// ==========================================
// GOOGLE STRATEGY
// ==========================================

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: Error | null, user?: Express.User) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName || 'Player';
        const avatarUrl = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('Email nao encontrado na conta Google'));
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { google_id: profile.id },
        });

        if (!user) {
          // Check if email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            // Link Google account to existing user
            user = await prisma.user.update({
              where: { email },
              data: {
                google_id: profile.id,
                avatar_url: avatarUrl || existingUser.avatar_url,
              },
            });
          } else {
            // Create new user
            const username = generateUsername(email, profile.id);

            user = await prisma.user.create({
              data: {
                email,
                username,
                display_name: displayName,
                avatar_url: avatarUrl,
                google_id: profile.id,
              },
            });
          }
        } else {
          // Update last login
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              last_login_at: new Date(),
              avatar_url: avatarUrl || user.avatar_url,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('[Passport] Erro no Google Strategy:', error);
        return done(error as Error);
      }
    }
  )
);

// ==========================================
// SERIALIZE / DESERIALIZE
// ==========================================

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ==========================================
// HELPERS
// ==========================================

function generateUsername(email: string, googleId: string): string {
  const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  const suffix = googleId.slice(-4);
  return `${baseUsername}${suffix}`.toLowerCase().slice(0, 20);
}

export default passport;
