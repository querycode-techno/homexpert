// Write a function that connects to the database 
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', () => {
            console.log('Connected to MongoDB');
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}