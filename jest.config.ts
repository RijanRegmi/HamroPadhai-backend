import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/__tests__"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  restoreMocks: true,
  testPathIgnorePatterns: ["/node_modules/"],

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.test.json",
      },
    ],
  },

  moduleNameMapper: {
    "^uuid$": "<rootDir>/src/__tests__/__mocks__/uuid.js",
  },
};

export default config;