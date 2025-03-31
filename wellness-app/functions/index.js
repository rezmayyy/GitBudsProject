// index.js
const adminModeration = require("./adminModerationFunctions");
const contentFunctions = require("./contentFunctions");
const userAccountFunctions = require("./userAccountFunctions");
const miscFunctions = require("./miscFunctions");
const emailChangeFunctions = require("./emailChangeFunctions");

module.exports = {
    ...adminModeration,
    ...contentFunctions,
    ...userAccountFunctions,
    ...miscFunctions,
    ...emailChangeFunctions,
};
