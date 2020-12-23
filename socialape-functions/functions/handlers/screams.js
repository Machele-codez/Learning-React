const config = require("../util/config");
const { db, admin } = require("../util/admin");

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
                    ...doc.data()
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
        body: '',
        createdAt: new Date().toISOString(),
        screamImageURL: ''
    };

    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const BusBoy = require('busboy');

    // initialize busboy
    const busboy = new BusBoy({headers: request.headers});

    // object to hold file details
    let fileToBucket = {};

    // get body field value from form
    busboy.on('field', (fieldname, value) => {
        if (fieldname === "body")
            newScream.body = value
    })

    // get file details
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        // ensure image mimetype
        if (mimetype !== "image/jpeg" && mimetype !== "image/png")
            return response.status(400).json({ message: "Wrong File Type used as scream image" })
        
        // file extension
        const ext = filename.split('.')[filename.split('.').length - 1];
        // create random image name
        const imageName = `${Math.floor(Math.random() * 1000000000)}.${ext}`;
        // temporary file path
        const filepath = path.join(os.tmpdir(), imageName);
        // copy user provided file to in-memory path
        const tempFile = fs.createWriteStream(filepath);
        // pipe uploaded file into temporary stream
        file.pipe(tempFile)
        // populate file details object
        fileToBucket = { imageName, filepath, mimetype }
    })

    busboy.on('finish', () => {
        // upload to storage bucket
        admin.storage().bucket().upload(fileToBucket.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: fileToBucket.mimetype
                }
            }
        })
        // add file URL to new scream object and upload scream
        .then(() => {
            newScream.screamImageURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${fileToBucket.imageName}?alt=media`;

            return db.collection("screams")
                .add(newScream)
        })
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
    })

    // end busboy stream
    busboy.end(request.rawBody);

};
