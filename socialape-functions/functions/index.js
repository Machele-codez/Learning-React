const functions = require("firebase-functions");

// Express app
const express = require("express");
const app = express();

const {
    getAllScreams,
    postOneScream,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream,
} = require("./handlers/screams");

const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getUserDetails,
} = require("./handlers/users");

const firebaseAuthMiddleware = require("./util/firebaseAuthMiddleware");

const { db } = require("./util/admin");

// * Scream Routes
// ? getting screams from DB
app.get("/screams", getAllScreams);
// ? getting a single scream
app.get("/scream/:screamId", getScream);
// ? creating screams
app.post("/scream", firebaseAuthMiddleware, postOneScream);
// ? comment on scream
app.post("/scream/:screamId/comment", firebaseAuthMiddleware, commentOnScream);
// ? like a scream
app.get("/scream/:screamId/like", firebaseAuthMiddleware, likeScream);
// ? unlike a scream
app.get("/scream/:screamId/unlike", firebaseAuthMiddleware, unlikeScream);
// ? unlike a scream
app.delete("/scream/:screamId", firebaseAuthMiddleware, deleteScream);

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

// Firestore like trigger
exports.createNotificationOnLike = functions
    .region("europe-west2")
    .firestore.document("likes/{id}")
    .onCreate(likeSnapshot => {
        // get the scream document
        db.doc(`/screams/${likeSnapshot.data().screamId}`)
            .get()
            .then(screamSnapshot => {
                if (screamSnapshot.exists) {
                    // create a notification document with id being same as the like id
                    return db.doc(`/notifications/${likeSnapshot.id}`).set({
                        recipient: screamSnapshot.data().userHandle, // handle of user who uploaded scream
                        sender: likeSnapshot.data().userHandle, // handle of user who liked scream
                        read: false,
                        screamId: screamSnapshot.id,
                        type: "like",
                        createdAt: new Date().toISOString(),
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch(error => {
                console.error(error);
                return;
            });
    });

// Firestore unlike trigger
exports.deleteNotificationOnUnlike = functions
    .region("europe-west2")
    .firestore.document("likes/{id}")
    .onDelete(likeSnapshot => {
        // delete notification
        db.doc(`notifications/${likeSnapshot.id}`)
            .delete()
            .then(() => {
                return;
            })
            .catch(error => {
                console.log(error);
                return;
            });
    });

// Firestore comment trigger
exports.createNotificationOnComment = functions
    .region("europe-west2")
    .firestore.document("comments/{id}")
    .onCreate(commentSnapshot => {
        // get the scream document
        db.doc(`/screams/${commentSnapshot.data().screamId}`)
            .get()
            .then(screamSnapshot => {
                if (screamSnapshot.exists) {
                    // create a notification document with id being same as the like id
                    return db.doc(`/notifications/${commentSnapshot.id}`).set({
                        recipient: screamSnapshot.data().userHandle, // handle of user who uploaded scream
                        sender: commentSnapshot.data().userHandle, // handle of user who liked scream
                        read: false,
                        screamId: screamSnapshot.id,
                        type: "like",
                        createdAt: new Date().toISOString(),
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch(error => {
                console.error(error);
                return;
            });
    });
