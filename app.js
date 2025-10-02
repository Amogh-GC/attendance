// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log('📄 Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Authentication middleware
// No authentication middleware needed - just redirect to login on protected routes

// Routes

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Register page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Login POST
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register POST
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await user.save();

    res.json({ 
      success: true, 
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      console.log(err);
    }
    res.redirect('/login');
  });
});
// Logout route
app.post('/api/logout', (req, res) => {
  console.log('Logout request received');
  res.json({ success: true, message: 'Logout successful' });
});

// Protected route for the main attendance page
app.get('/', (req, res) => {
  // For the main page, we'll let the frontend handle authentication
  res.sendFile(path.join(__dirname, 'att.html'));
});

// API endpoint to get current user info (fetch from database)
app.get('/api/user', async (req, res) => {
  try {
    // Since we don't have authentication, let's fetch the first user from the database
    const user = await User.findOne().select('-password');
    
    if (user) {
      res.json({ 
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'student'
        }
      });
    } else {
      // If no users in database, return default user
      res.json({ 
        user: {
          id: 'no-user',
          name: 'No User Found',
          email: 'no-user@example.com',
          role: 'student'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    // Return default user in case of error
    res.json({ 
      user: {
        id: 'error',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'student'
      }
    });
  }
});

// API endpoint to get attendance data (for future use)
// app.get('/api/attendance/:classId', requireAuth, (req, res) => {
//   const { classId } = req.params;
//   // This is where you could fetch attendance data from a database
//   // For now, sending a simple response
//   res.json({ 
//     message: `Attendance data for ${classId}`,
//     classId: classId,
//     status: 'success',
//     user: req.session.userName
//   });
// });

// // API endpoint to update attendance (for future use)
// app.post('/api/attendance/:classId', requireAuth, (req, res) => {
//   const { classId } = req.params;
//   const { date, status } = req.body;
  
//   // This is where you could save attendance data to a database
//   res.json({ 
//     message: `Attendance updated for ${classId}`,
//     classId: classId,
//     date: date,
//     status: status,
//     success: true,
//     user: req.session.userName
//   });
// });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).redirect('/login');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Attendance Dashboard available at http://localhost:${PORT}`);
  console.log(`🔧 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`🔐 Login page available at http://localhost:${PORT}/login`);
});
    