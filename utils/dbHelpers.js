// utils/dbHelpers.js
const mongoose = require("mongoose");

/**
 * Validate that a referenced document exists in a collection
 * @param {mongoose.Model} Model - Mongoose model
 * @param {Object} filter - filter to check existence
 * @param {String} errorMsg - error message if not exists
 */
async function validateExistence(Model, filter, errorMsg) {
    const exists = await Model.exists(filter);
    if (!exists) throw new Error(errorMsg);
}

/**
 * Cascade delete documents of a model based on filter
 * @param {mongoose.Model} Model
 * @param {Object} filter
 */
async function cascadeDelete(Model, filter) {
    await Model.deleteMany(filter);
}

module.exports = { validateExistence, cascadeDelete };