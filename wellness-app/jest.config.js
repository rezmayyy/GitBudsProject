// jest.config.js
module.exports = {
    preset: 'jest-puppeteer',
    testEnvironment: 'jest-environment-puppeteer', // Explicitly specify the environment
    testEnvironmentOptions: {}, // Even if empty
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Load our stub
    testMatch: ['**/src/assets/Tests/**/*.e2e.test.js'],
};
