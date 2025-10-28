# Attendance Management System

A modern web-based attendance management system built with Node.js, Express, MongoDB, and vanilla JavaScript. Features user authentication, interactive attendance calendar, and beautiful glassmorphism UI design.

## 🚀 Features

- **User Authentication**: Secure registration and login system with Google OAuth support
- **Google Sign-In**: Quick authentication using your Google account
- **Attendance Tracking**: Interactive calendar interface for marking attendance
- **Dashboard**: Visual attendance statistics and progress tracking
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with glassmorphism effects

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB Atlas account](https://www.mongodb.com/atlas) (for cloud database) OR [MongoDB Community Edition](https://www.mongodb.com/try/download/community) (for local database)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Amogh-GC/Attendance.git
cd Attendance
```

### 2. Install Dependencies

```bash
npm install
```

This will install the required packages:

- `express` - Web framework
- `mongoose` - MongoDB object modeling
- `bcryptjs` - Password hashing
- `dotenv` - Environment variable management
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth 2.0 strategy
- `express-session` - Session management

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Create .env file
touch .env    # On macOS/Linux
type nul > .env    # On Windows
```

Add the following environment variables to your `.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/attendance_db

# Server Configuration
PORT=3000

# Session Secret (change this to a random string)
SESSION_SECRET=your-secret-key-change-this-in-production

# Google OAuth Configuration (Optional - see GOOGLE_OAUTH_SETUP.md for setup)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**Note**: To enable Google Sign-In, follow the detailed setup guide in [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

### 4. MongoDB Setup

#### Option A: Using MongoDB Atlas (Recommended)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and replace `MONGODB_URI` in your `.env` file

#### Option B: Using Local MongoDB

1. Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Use this connection string in your `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/attendance_db
   ```

### 5. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
# Install nodemon globally (optional)
npm install -g nodemon

# Run with nodemon
nodemon app.js
```

### 6. Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

## 📁 Project Structure

```
Attendance/
├── app.js                 # Main server file
├── package.json           # Project dependencies
├── .env                   # Environment variables (create this)
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore rules
├── att.html              # Main dashboard page
├── test-setup.js         # Test configuration
├── README.md             # This file
├── GOOGLE_OAUTH_SETUP.md # Google OAuth setup guide
├── config/
│   └── passport.js       # Passport authentication configuration
├── models/
│   └── User.js           # User data model
├── views/
│   ├── login.html        # Login page
│   └── register.html     # Registration page
├── public/
│   ├── css/
│   │   ├── styles.css    # Main stylesheet
│   │   └── auth.css      # Authentication styles
│   └── js/
│       └── attendance.js # Frontend JavaScript
```

## 🎯 Usage

### User Registration

1. Navigate to `/register.html`
2. Fill in username, email, and password
3. Click "Sign Up" to create account
4. **OR** Click "Continue with Google" for quick registration

### User Login

1. Navigate to `/login.html`
2. Enter your credentials
3. Click "Sign In" to access dashboard
4. **OR** Click "Continue with Google" to sign in with your Google account

### User Login

1. Navigate to `/login.html`
2. Enter your credentials
3. Click "Sign In" to access dashboard

### Attendance Management

1. After login, you'll see the main dashboard
2. Click on calendar dates to mark attendance
3. View attendance statistics in the cards
4. Use the month navigation to view different months

## 🔧 API Endpoints

### Authentication

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `GET /logout` - Logout user
- `GET /api/current-user` - Get current authenticated user
- `GET /api/user/:userId` - Get user details

### Attendance

- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/:userId` - Get user attendance data

## 🚀 Deployment

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

```env
MONGODB_URI=your-production-mongodb-uri
PORT=3000
NODE_ENV=production
```

### Deploy to Heroku

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Login to Heroku: `heroku login`
3. Create a new app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=your-mongodb-uri
   ```
5. Deploy: `git push heroku main`

### Deploy to Other Platforms

The application can be deployed to any platform that supports Node.js:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)

## 🛠️ Development

### Adding New Features

1. Create a new branch: `git checkout -b feature-name`
2. Make your changes
3. Test thoroughly
4. Commit: `git commit -m "Add feature description"`
5. Push: `git push origin feature-name`
6. Create a pull request

### Database Schema

#### User Model

```javascript
{
  username: String (required, unique)
  email: String (required, unique)
  password: String (required, hashed)
  attendance: [
    {
      date: Date
      status: String ('present', 'absent', 'late')
    }
  ]
  createdAt: Date
}
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Check your MongoDB URI in `.env`
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify database user permissions

2. **Port Already in Use**

   - Change the PORT in `.env` file
   - Kill the process using the port: `lsof -ti:3000 | xargs kill` (macOS/Linux)

3. **Dependencies Not Installing**

   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

4. **Page Not Loading**
   - Check that the server is running
   - Verify the correct port in your browser
   - Check browser console for errors

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing [GitHub Issues](https://github.com/Amogh-GC/Attendance/issues)
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database powered by [MongoDB](https://www.mongodb.com/)
- UI inspired by modern design principles
- Icons by [Font Awesome](https://fontawesome.com/)
