import mongoose from 'mongoose';
import 'dotenv/config'

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    console.log(`DB connected...`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1); // Exit the process if the database connection fails
  }
};

export default connectDatabase;
