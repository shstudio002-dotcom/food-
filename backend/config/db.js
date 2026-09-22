const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://data:wf6be2nIMyJvQNzW@cluster0.p40ufzt.mongodb.net/shopmatries?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected Successfully to shopmatries database');
  } catch (err) {
    console.error('⚠️ MongoDB Connection Error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;