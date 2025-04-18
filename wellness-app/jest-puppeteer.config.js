// jest-puppeteer.config.js
module.exports = {
    launch: {
        headless: true, // Use false to see the browser during testing
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
};
