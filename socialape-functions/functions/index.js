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
    getAuthUser,
    getUserDetails,
    markNotificationsRead,
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
// ? get authenticated user's details route
app.get("/user", firebaseAuthMiddleware, getAuthUser);
// ? get any user's details route
app.get("/user/:handle", getUserDetails);
// ? mark notifications as read
app.put("/notifications", firebaseAuthMiddleware, markNotificationsRead);

// export all routes defined by the Express app as /api/<route>
exports.api = functions.region("europe-west2").https.onRequest(app);

// Firestore like trigger
exports.createNotificationOnLike = functions
    .region("europe-west2")
    .firestore.document("likes/{id}")
    .onCreate(likeSnapshot => {
        // get the scream document
        return db
            .doc(`/screams/${likeSnapshot.data().screamId}`)
            .get()
            .then(screamSnapshot => {
                if (
                    screamSnapshot.exists &&
                    likeSnapshot.data().userHandle !==
                        screamSnapshot.data().userHandle
                ) {
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
            .catch(error => console.error(error));
    });

// Firestore unlike trigger
exports.deleteNotificationOnUnlike = functions
    .region("europe-west2")
    .firestore.document("likes/{id}")
    .onDelete(likeSnapshot => {
        // delete notification
        return db
            .doc(`notifications/${likeSnapshot.id}`)
            .delete()
            .catch(error => console.error(error));
    });

// Firestore comment trigger
exports.createNotificationOnComment = functions
    .region("europe-west2")
    .firestore.document("comments/{id}")
    .onCreate(commentSnapshot => {
        console.log("Comment Trigger");
        // get the scream document
        return db
            .doc(`/screams/${commentSnapshot.data().screamId}`)
            .get()
            .then(screamSnapshot => {
                if (
                    screamSnapshot.exists &&
                    likeSnapshot.data().userHandle !==
                        screamSnapshot.data().userHandle
                ) {
                    // create a notification document with id being same as the like id
                    return db.doc(`/notifications/${commentSnapshot.id}`).set({
                        recipient: screamSnapshot.data().userHandle, // handle of user who uploaded scream
                        sender: commentSnapshot.data().userHandle, // handle of user who liked scream
                        read: false,
                        screamId: screamSnapshot.id,
                        type: "comment",
                        createdAt: new Date().toISOString(),
                    });
                }
                console.error("Scream not found");
            })
            .catch(error => console.error(error));
    });

// user profile picture update trigger
exports.onUserImageChange = functions
    .region("europe-west2")
    .firestore.document("users/{handle}")
    .onUpdate(userDoc => {
        console.log(userDoc.before.data());
        console.log(userDoc.after.data());
        // check if the `imageURL` field changed
        if (userDoc.before.data().imageURL !== userDoc.after.data().imageURL) {
            // create batch for multiple screams that are to be updated
            const batch = db.batch();
            // retrieve all screams created by the user
            return db
                .collection("screams")
                .where("userHandle", "==", userDoc.before.data().handle)
                .get()
                .then(screamDocs => {
                    // loop through the scream documents
                    screamDocs.forEach(screamDoc => {
                        // using the document references, update the userImage field of the scream
                        batch.update(screamDoc.ref, {
                            userImage: userDoc.after.data().imageURL,
                        });
                        return batch.commit();
                    });
                })
                .catch(error => console.error);
        } else return true;
    });

// scream delete trigger
exports.onScreamDelete = functions
    .region("europe-west2")
    .firestore.document("screams/{screamId}")
    .onDelete((snapshot, context) => {
        // create batch
        const batch = db.batch();
        const screamId = context.params.screamId;

        // array to hold queries to retrieve documents related to scream from different collections
        let screamRelQueries = [];
        // comment documents related to scream
        screamRelQueries.push(
            db.collection("comments").where("screamId", "==", screamId).get()
        );
        // like documents related to scream
        screamRelQueries.push(
            db.collection("likes").where("screamId", "==", screamId).get()
        );
        // notification documents related to scream
        screamRelQueries.push(
            db
                .collection("notifications")
                .where("screamId", "==", screamId)
                .get()
        );

        // perform db queries concurrently
        return Promise.all(screamRelQueries)
            .then(querySnapshots => {
                // return array of all related documents
                let docs = querySnapshots
                    // .map to return an array of arrays of documents
                    .map(querySnapshot => querySnapshot.docs)
                    // reduce the array of arrays to a single array of all documents
                    .reduce((accumulator, queryDocs) => [...accumulator, ...queryDocs]);

                // loop through documents and perform delete
                docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                return batch.commit();
            })
            .catch(error => console.error(error));
    });
