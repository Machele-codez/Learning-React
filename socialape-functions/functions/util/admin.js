const admin = require("firebase-admin");

// initialize firestore admin
admin.initializeApp();

// Firestore DB
const db = admin.firestore();

module.exports = { admin, db };
