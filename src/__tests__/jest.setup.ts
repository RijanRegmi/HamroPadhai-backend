import { connectDatabaseTest } from './unit/services/setup';
import mongoose from "mongoose";

beforeAll(async () => {
  await connectDatabaseTest();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
