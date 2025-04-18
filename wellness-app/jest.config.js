// jest.config.js
module.exports = {
    preset: 'jest-puppeteer',
    testEnvironment: 'jest-environment-puppeteer', // Explicitly specify the environment
    testEnvironmentOptions: {}, // Even if empty
    testMatch: ['**/src/assets/Tests/**/*.e2e.test.js'],
};
