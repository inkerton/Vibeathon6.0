import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;

        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        const result = await authService.googleAuth({
          id: profile.id,
          email,
          name,
        });

        return done(null, result);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
