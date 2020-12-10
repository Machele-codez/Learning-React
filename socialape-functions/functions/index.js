const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");

const app = express();

admin.initializeApp();

// getting screams from DB
app.get("/screams", (request, response) => {
    // make firestore call to get data from screams collection
    // returns a Promise
    admin
        .firestore()
        .collection("screams")
        .get()
        // handle returned Promise with data
        .then(data => {
            let screams = [];
            // data is a QuerySnapshot Object
            data.forEach(doc => screams.push(doc.data()));
            // return Array of documents
            return response.json(screams);
        })
        // handle error
        .catch(error => console.error(error));
});

// creating screams
app.post("/screams", (request, response) => {
    if (request.method !== "POST")
        return response.status(400).json({ error: "Method not allowed" });

    // create scream Object from request body
    const newScream = {
        userHandle: request.body.userHandle,
        body: request.body.body,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    };

    admin
        .firestore()
        .collection("screams")
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

// export all routes defined by the Express app with as /api/<route>
exports.api = functions.https.onRequest(app);
