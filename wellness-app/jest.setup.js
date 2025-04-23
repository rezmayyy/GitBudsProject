// jest.setup.js
if (!global.context) {
    global.context = {
        isIncognito: () => false,
        // Optionally, provide a dummy close() to satisfy teardown
        close: async () => { },
    };
}