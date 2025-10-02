const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  studentId: {
    type: String,
    sparse: true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  semester: {
    type: Number,
    min: 1,
    max: 8
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    studentId: this.studentId,
    department: this.department,
    semester: this.semester,
    profilePicture: this.profilePicture,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
});

// Method to check if user is a student
userSchema.methods.isStudent = function() {
  return this.role === 'student';
};

// Method to check if user is a teacher
userSchema.methods.isTeacher = function() {
  return this.role === 'teacher';
};

// Method to check if user is an admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Method to get safe user data (without sensitive info)
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.verificationToken;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

// Pre-save middleware to handle email normalization
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);