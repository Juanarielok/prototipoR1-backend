import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^(.*)/config/database$': '<rootDir>/tests/setup/testDatabase',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/globalSetup.ts'],
  testTimeout: 15000,
  silent: true,
};

export default config;
