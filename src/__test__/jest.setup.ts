import { connectDatabaseTest } from "./unit/services/setup";
import mongoose from "mongoose";

jest.setTimeout(30000);

beforeAll(async () => {
  await connectDatabaseTest();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});