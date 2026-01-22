// ==========================================
// PASSPORT CONFIGURATION - Google OAuth
// ==========================================

import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import { env } from './env.config';

const prisma = new PrismaClient();

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
          where: { googleId: profile.id },
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
                googleId: profile.id,
                avatarUrl: avatarUrl || existingUser.avatarUrl,
              },
            });
          } else {
            // Create new user
            const username = generateUsername(email, profile.id);

            user = await prisma.user.create({
              data: {
                email,
                username,
                displayName,
                avatarUrl,
                googleId: profile.id,
              },
            });
          }
        } else {
          // Update last login
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLoginAt: new Date(),
              avatarUrl: avatarUrl || user.avatarUrl,
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
