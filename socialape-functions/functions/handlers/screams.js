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
                    screamId: doc.id, // id of the document - actually the scream id
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
        userImage: request.user.imageURL,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
    };

    db.collection("screams")
        .add(newScream)
        // Promise when fulfilled returns document
        .then(screamRef => {
            const scream = newScream;
            scream.screamId = screamRef.id;
            response.json(scream);
        })
        .catch(error => {
            response.status(500).json({ error: "something went wrong" });
            console.error(error);
        });
};

// get single scream
exports.getScream = (request, response) => {
    let screamData = {};

    db.doc(`/screams/${request.params.screamId}`)
        .get()
        .then(doc => {
            if (!doc.exists)
                return response
                    .status(404)
                    .json({ message: "Scream not found" });
            else {
                screamData = doc.data();
                screamData.screamId = doc.id;

                return db
                    .collection("comments")
                    .where("screamId", "==", request.params.screamId)
                    .orderBy("createdAt", "desc")
                    .get()
                    .then(comments => {
                        screamData.comments = [];
                        comments.forEach(commentSnapshot =>
                            screamData.comments.push(commentSnapshot.data())
                        );

                        return response.status(200).json(screamData);
                    })
                    .catch(error => {
                        console.error(error);
                        return response.status(500).json({ error: error.code });
                    });
            }
        });
};

// comment on a scream
exports.commentOnScream = (request, response) => {
    // validate for non-empty comment body
    if (!request.body.body.trim())
        return response.status(400).json({ comment: "Must not be empty" });

    // comment Object
    const newComment = {
        body: request.body.body.trim(),
        createdAt: new Date().toISOString(),
        screamId: request.params.screamId,
        userHandle: request.user.handle,
        userImageURL: request.user.imageURL,
    };

    db.doc(`/screams/${request.params.screamId}`)
        .get()
        .then(doc => {
            if (!doc.exists)
                return response.status(404).json({ error: "Scream not found" });
            else {
                return doc.ref.update({
                    commentCount: doc.data().commentCount + 1,
                })
				.then(() => db.collection("comments").add(newComment))
				.then(() => response.json(newComment))
				.catch(error => {
					console.error(error);
					response.status(500).json({ error: "Something went wrong" });
				});
			}
        })
};

// add a like to a scream
exports.likeScream = (request, response) => {
    // like document from db with details matching that in request
    const likeDocument = db
        .collection("likes")
        .where("userHandle", "==", request.user.handle)
        .where("screamId", "==", request.params.screamId)
        .limit(1);

    // scream document from db with details matching that in request
    const screamDocument = db.doc(`/screams/${request.params.screamId}`);

    let screamData;

    screamDocument
        .get()
        .then(screamDoc => {
            if (screamDoc.exists) {
                screamData = screamDoc.data();
                screamData.screamId = screamDoc.id;

                return likeDocument.get();
            } else
                return response.status(404).json({ error: "Scream not found" });
        })
        .then(likeDocArray => {
            if (likeDocArray.empty) {
                // create document for the `like` in DB
                db.collection("likes")
                    .add({
                        userHandle: request.user.handle,
                        screamId: request.params.screamId,
                    })
                    // update like-count of scream
                    .then(() => {
                        screamData.likeCount++;
                        return screamDocument.update({
                            likeCount: screamData.likeCount,
                        });
                    })
                    // return JSON response
                    .then(() => {
                        return response.json(screamData);
                    });
            } else {
                return response
                    .status(400)
                    .json({ error: "Scream already liked" });
            }
        })
        .catch(error => {
            console.error(error);
            return response.json({ error: error.code }).status(500);
        });
};

// unlike a scream
exports.unlikeScream = (request, response) => {
    const likeDocument = db
        .collection("likes")
        .where("screamId", "==", request.params.screamId)
        .where("userHandle", "==", request.user.handle)
        .limit(1);

    const screamDocument = db.doc(`/screams/${request.params.screamId}`);

    let screamData;

    screamDocument
        .get()
        .then(screamDoc => {
            if (!screamDoc.exists)
                return response.status(404).json({ error: "Scream not found" });
            else {
                screamData = screamDoc.data();
                screamData.screamId = screamDoc.id;

                return likeDocument.get();
            }
        })
        .then(likeDocArray => {
            if (likeDocArray.empty)
                return response.status(400).json({ error: "Scream not liked" });
            else {
                // delete like document from DB
                db.doc(`/likes/${likeDocArray.docs[0].id}`)
                    .delete()
                    // decrease like-count of scream
                    .then(() => {
                        screamData.likeCount--;
                        return screamDocument.update({
                            likeCount: screamData.likeCount,
                        });
                    })
                    .then(() => response.json(screamData));
            }
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
};

// delete a scream
exports.deleteScream = (request, response) => {
    const screamDocument = db.doc(`/screams/${request.params.screamId}`);

    screamDocument
        .get()
        .then(doc => {
            // ensuring that scream exists in DB
            if (!doc.exists)
                return response.status(404).json({ error: "Scream not found" });
            // ensuring that user is authorized to delete scream
            else if (doc.data().userHandle !== request.user.handle)
                return response.status(403).json({ error: "Unauthorized" });
            // delete scream document from DB
            else return doc.ref.delete();
        })
        .then(() => response.json({ message: "Scream deleted successfully" }))
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
};
