const { db, admin } = require("../util/admin");

const firebase = require("firebase");
const firebaseConfig = require("../util/config");

firebase.initializeApp(firebaseConfig);

const { validateSignupData, validateLoginData } = require("../util/validators");
const config = require("../util/config");

exports.signup = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    };

    // * VALIDATION
    const { valid, errors } = validateSignupData(newUser);
    if (!valid) return response.status(400).json(errors);

    let token; //  auth token to be generated after sign up
    let userId;
    
    const blankProfileImage = "blank-profile-picture.png";

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
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        // send auth token back in response and add extra user data to Firestore 'users' collection
        .then(userAuthToken => {
            token = userAuthToken;
            const userData = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId,
                imageURL: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${blankProfileImage}?alt=media`
            };
            return db.doc(`/users/${userData.handle}`).set(userData);
        })
        .then(() => response.status(201).json({ token }))
        // catch errors
        .catch(error => {
            console.error(error);
            // handle existing email error
            if (error.code === "auth/email-already-in-use")
                return response
                    .status(400)
                    .json({ email: "email already in use" });
            // other errors
            return response.status(500).json({ error: error.code });
        });
};

exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password,
    };

    // * VALIDATION
    const { valid, errors } = validateLoginData(user);
    if (!valid) {
        return response.status(400).json(errors);
    }

    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then(userCreds => userCreds.user.getIdToken())
        .then(token => response.status(200).json({ token }))
        .catch(error => {
            console.error(error);
            if (error.code === "auth/wrong-password")
                return response
                    .status(403)
                    .json({ general: "Wrong credentials, please try again" });

            return response.status(500).json({ error: error.code });
        });
};

exports.uploadImage = (request, response) => {
    const BusBoy = require("busboy");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");

    const busboy = new BusBoy({ headers: request.headers });
    
    let imageFileName, imageToBeUploaded = {};
    
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname);
        console.log(filename);
        console.log(mimetype);
        
        // getting extension
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        
        // using a random filename instead
        imageFileName = `${Math.round(Math.random()*10000000000)}.${imageExtension}`;
        
        // create a path to the file in-memory using tmpdir
        const filepath = path.join(os.tmpdir(), imageFileName);
        
        imageToBeUploaded = { filepath, mimetype };
        
        file.pipe(fs.createWriteStream(filepath))
    });
    
    busboy.on('finish', () => {
        // upload image to storage
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        // add image url to user's info in DB
        .then(() => {
            const imageURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            
            return db.doc(`/users/${request.user.handle}`).update({ imageURL });
        })
        .then(() => {
            return response.json({message: "Image uploaded successfully"})
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code })
        })
    })

    // required to end
    // ! prevents an unending request
      busboy.end(request.rawBody);
};
