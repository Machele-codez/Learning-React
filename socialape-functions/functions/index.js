const functions = require("firebase-functions");
const admin = require("firebase-admin");

// initialize firestore admin
admin.initializeApp();

// Express app
const express = require("express");
const app = express();

// initialize firebase app
const firebaseConfig = {
    apiKey: "AIzaSyBa56iuIUrEBXBWpKmc23hFUTLEXBWGY78",
    authDomain: "socialape-b4a2b.firebaseapp.com",
    projectId: "socialape-b4a2b",
    storageBucket: "socialape-b4a2b.appspot.com",
    messagingSenderId: "684073853542",
    appId: "1:684073853542:web:342b41fc2bd511af2b03a7",
    measurementId: "G-X7CRL9BZTZ",
};

const firebase = require("firebase");
const { apps } = require("firebase-functions/lib/apps");
firebase.initializeApp(firebaseConfig);

// Firestore DB
const db = admin.firestore();

// TODO getting screams from DB
app.get("/screams", (request, response) => {
    // make firestore call to get data from screams collection
    // returns a Promise
    db.collection("screams")
        .orderBy("createdAt", "desc")
        .get()
        // handle returned Promise with data
        .then(data => {
            let screams = [];
            // data is a QuerySnapshot Object
            data.forEach(doc => {
                screams.push({
                    screamID: doc.id, // id of the document - actually the scream id
                    ...doc.data(),
                });
            });
            // return Array of documents
            return response.json(screams);
        })
        // handle error
        .catch(error => console.error(error));
});

// TODO creating screams
app.post("/scream", (request, response) => {
    // create scream Object from request body
    const newScream = {
        userHandle: request.body.userHandle,
        body: request.body.body,
        createdAt: new Date().toISOString(),
    };

    db.collection("screams")
        .add(newScream)
        // Promise when fulfilled returns document reference
        .then(scream => {
            response.json({
                message: `scream ${scream.id} created successfully`,
            });
        })
        .catch(error => {
            response.status(500).json({ error: "something went wrong" });
            console.error(error);
        });
});

// TODO signup route
app.post("/signup", (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    };

    // ? Validate data
    // get document corresponding to the new user's handle
    db.doc(`/users/${newUser.handle}`)
        .get()
        // even if the doc doesn't exist, a snapshot is returned so we have to check manually
        .then(doc => {
            // if the user with the handle already exists
            if (doc.exists) {
                return response
                    .status(400)
                    .json({ handle: "This handle is already taken" });
            } else {
                // if the handle is not taken
                // ? submit to firebase authentication backend
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(
                        newUser.email,
                        newUser.password
                    );
            }
        })
        // if the user is successfully created, generate auth token
        .then(data => {
            return data.user.getIdToken();
        })
        // send auth token back in response
        .then(token => {
            return response.status(201).json({ token });
        })
        // catch errors
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
});

// export all routes defined by the Express app with as /api/<route>
exports.api = functions.region("europe-west2").https.onRequest(app);
