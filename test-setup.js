// Simple test to check if all dependencies are working
require('dotenv').config();

console.log('🔍 Checking Dependencies...');

try {
  const express = require('express');
  console.log('✅ Express installed');
  
  const mongoose = require('mongoose');
  console.log('✅ Mongoose installed');
  
  const bcrypt = require('bcryptjs');
  console.log('✅ BCrypt installed');
  
  const session = require('express-session');
  console.log('✅ Express-session installed');
  
  const MongoStore = require('connect-mongo');
  console.log('✅ Connect-mongo installed');
  
  console.log('\n🌍 Environment Variables:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
  console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Not set');
  console.log('PORT:', process.env.PORT || '3000 (default)');
  
  console.log('\n🎉 All dependencies are properly installed!');
  console.log('You can now run: npm start or npm run dev');
  
} catch (error) {
  console.error('❌ Missing dependency:', error.message);
  console.log('\n📦 Please install missing dependencies:');
  console.log('npm install express mongoose bcryptjs express-session connect-mongo dotenv');
}