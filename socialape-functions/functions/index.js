const functions = require("firebase-functions");

// Express app
const express = require("express");
const app = express();

const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signup, login, uploadImage, addUserDetails } = require("./handlers/users");

const FirebaseAuthMiddleware = require('./util/firebaseAuthMiddleware');


// * Scream Routes
// TODO getting screams from DB
app.get("/screams", getAllScreams);
// TODO creating screams
app.post("/scream", FirebaseAuthMiddleware, postOneScream);


// * User Routes
// TODO signup route
app.post("/signup", signup);
// TODO login route
app.post("/login", login);
// TODO image upload route
app.post("/user/image", FirebaseAuthMiddleware, uploadImage);
// TODO add user details route
app.post("/user", FirebaseAuthMiddleware, addUserDetails);

// export all routes defined by the Express app with as /api/<route>
exports.api = functions.region("europe-west2").https.onRequest(app);
