import mongoose from 'mongoose';

export async function connectMongo() {
  if (mongoose.connections[0]?.readyState) {
    return mongoose.connection;
  }
  await mongoose.connect(process.env.MONGODB_URI);
  return mongoose.connection;
}
