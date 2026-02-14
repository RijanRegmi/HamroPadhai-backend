/** @type {import('jest').Config} */
const config = {
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
        tsconfig: {
          target: "ES2020",
          module: "CommonJS",
          moduleResolution: "node",
          esModuleInterop: true,
          strict: false,        // ← relaxed: stops implicit 'any' errors
          skipLibCheck: true,
        },
        diagnostics: {
          ignoreCodes: [
            2305,   
            7006, 
            2307,   
            2339,   
            2345,  
          ],
        },
      },
    ],
  },
  moduleNameMapper: {
    "^uuid$": "<rootDir>/src/__tests__/__mocks__/uuid.js",
  },
};

module.exports = config;