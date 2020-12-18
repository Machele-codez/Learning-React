const { db } = require("../util/admin");

// get all screams
exports.getAllScreams = (request, response) => {
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
};

// create new scream
exports.postOneScream = (request, response) => {
    // create scream Object from request body
    const newScream = {
        userHandle: request.user.handle,
        body: request.body.body,
        createdAt: new Date().toISOString(),
    };

    db.collection("screams")
        .add(newScream)
        // Promise when fulfilled returns document
        .then(scream => {
            response.json({
                message: `scream ${scream.id} created successfully`,
            });
        })
        .catch(error => {
            response.status(500).json({ error: "something went wrong" });
            console.error(error);
        });
};
