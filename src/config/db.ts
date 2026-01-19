import mongoose from "mongoose"; 
export const connectDB = async () => { 
  if (!process.env.MONGO_URI) {
     throw new Error("MONGO_URI is missing"); 
  } 
  const conn = await mongoose.connect(process.env.MONGO_URI); 
  console.log("MongoDB connected to:", conn.connection.name); 
};