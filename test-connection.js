import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas successfully!');
        
        // Test vector search index
        const db = mongoose.connection.db;
        const indexes = await db.collection('chunks').listIndexes().toArray();
        console.log('\nAvailable indexes:', indexes.map(idx => idx.name));
        
        // Test collection exists
        const collections = await db.listCollections().toArray();
        console.log('\nAvailable collections:', collections.map(col => col.name));
        
        console.log('\n🎉 Setup complete! Your MongoDB Atlas instance is ready for vector search.');
    } catch (error) {
        console.error('❌ Connection error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testConnection();