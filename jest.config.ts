import type { Config } from 'jest';

const config: Config = {
  // Use the ESM preset for ts-jest
  preset: 'ts-jest/presets/default-esm',
  
  testEnvironment: 'node',
  
  // Important: Tell Jest this is an ESM environment
  extensionsToTreatAsEsm: ['.ts'],
  
  roots: ['<rootDir>/tests'],
  
  testMatch: [
    '**/tests/**/*.test.ts'
  ],

  // Module name mapping for path aliases and ESM resolution
  moduleNameMapper: {
    // This handles .js imports that should resolve to .ts files (ESM requirement)
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // Your path aliases
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@middlewares/(.*)$": "<rootDir>/src/middlewares/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
  },

  // Transform configuration for TypeScript with ESM
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'esnext',
        moduleResolution: 'node',
      }
    }],
  },

  // Don't transform node_modules except for specific packages that need it
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  verbose: true,
  
  // Handle globals for ESM
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};

export default config;