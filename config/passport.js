const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, update their info from Google profile
          user.name = profile.displayName;
          user.profilePicture = profile.photos[0]?.value || user.profilePicture;
          await user.save();
          console.log('✅ Google user logged in:', user.email);
          return done(null, user);
        }

        // Check if email already exists with local auth
        const existingEmailUser = await User.findOne({ 
          email: profile.emails[0].value.toLowerCase() 
        });

        if (existingEmailUser) {
          // Link Google account to existing user and UPDATE user info
          existingEmailUser.googleId = profile.id;
          existingEmailUser.authProvider = 'google';
          existingEmailUser.name = profile.displayName; // Update name from Google
          if (!existingEmailUser.profilePicture) {
            existingEmailUser.profilePicture = profile.photos[0]?.value;
          }
          await existingEmailUser.save();
          console.log('✅ Linked Google account to existing user:', existingEmailUser.email);
          return done(null, existingEmailUser);
        }

        // Create new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value.toLowerCase(),
          profilePicture: profile.photos[0]?.value,
          authProvider: 'google',
          isActive: true,
          emailVerified: true
        });

        done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
