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

        // The `done` callback expects the user object as the second argument.
        // The `result` from `googleAuth` contains the user object along with tokens.
        // We pass the entire result object so it can be accessed in the controller's
        // `googleAuthCallback` method via `req.user`.
        return done(null, result as any);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
