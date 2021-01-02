const functions = require("firebase-functions");

// Express app
const express = require("express");
const app = express();

const { getAllScreams, postOneScream, getScream, commentOnScream } = require("./handlers/screams");
const { signup, login, uploadImage, addUserDetails, getUserDetails } = require("./handlers/users");

const firebaseAuthMiddleware = require("./util/firebaseAuthMiddleware");


// * Scream Routes
// ? getting screams from DB
app.get("/screams", getAllScreams);
// ? getting a single scream
app.get("/scream/:screamId", getScream);
// ? creating screams
app.post("/scream", firebaseAuthMiddleware, postOneScream);
// ? comment on scream
app.post("/scream/:screamId/comment", firebaseAuthMiddleware, commentOnScream);


// * User Routes
// ? signup route
app.post("/signup", signup);
// ? login route
app.post("/login", login);
// ? image upload route
app.post("/user/image", firebaseAuthMiddleware, uploadImage);
// ? add extra user details route
app.post("/user", firebaseAuthMiddleware, addUserDetails);
// ? get user details route
app.get("/user", firebaseAuthMiddleware, getUserDetails);

// export all routes defined by the Express app as /api/<route>
exports.api = functions.region("europe-west2").https.onRequest(app);
