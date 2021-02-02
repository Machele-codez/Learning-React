const { db, admin } = require("../util/admin");

const firebase = require("firebase");
const firebaseConfig = require("../util/config");

firebase.initializeApp(firebaseConfig);

const {
    validateSignupData,
    validateLoginData,
    filterUserDetails,
} = require("../util/validators");

const { user } = require("firebase-functions/lib/providers/auth");

// signup a new user
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
                imageURL: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${blankProfileImage}?alt=media`,
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
            return response
                .status(500)
                .json({ general: "Something went wrong, please try again" });
        });
};

// logging in user - getting id (auth) token
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
            if (
                error.code === "auth/wrong-password" ||
                error.code === "auth/user-not-found"
            )
                return response
                    .status(403)
                    .json({ general: "Wrong credentials, please try again" });
            else if (error.code === "auth/invalid-email")
                return response
                    .status(403)
                    .json({ email: "Invalid" });
            else return response.status(500).json({ error: error.code });
        });
};

// uploading user profile image
exports.uploadImage = (request, response) => {
    const BusBoy = require("busboy");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");

    const busboy = new BusBoy({ headers: request.headers });

    let imageFileName,
        imageToBeUploaded = {};

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== "image/png" && mimetype !== "image/jpeg")
            return response
                .status(400)
                .json({ message: "Wrong file type submitted" });

        // getting extension
        const imageExtension = filename.split(".")[
            filename.split(".").length - 1
        ];

        // using a random filename instead
        imageFileName = `${Math.round(
            Math.random() * 10000000000
        )}.${imageExtension}`;

        // create a path to the file in-memory using tmpdir
        const filepath = path.join(os.tmpdir(), imageFileName);

        imageToBeUploaded = { filepath, mimetype };

        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on("finish", () => {
        // upload image to storage
        admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filepath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype,
                    },
                },
            })
            // add image url to user's info in DB
            .then(() => {
                const imageURL = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;

                return db
                    .doc(`/users/${request.user.handle}`)
                    .update({ imageURL });
            })
            .then(() => {
                return response.json({
                    message: "Image uploaded successfully",
                });
            })
            .catch(error => {
                console.error(error);
                return response.status(500).json({ error: error.code });
            });
    });

    // required to end
    // ! prevents an unending request
    busboy.end(request.rawBody);
};

// adding extra user details
exports.addUserDetails = (request, response) => {
    // make sure not to send empty values to DB
    const userDetails = filterUserDetails(request.body);

    db.doc(`/users/${request.user.handle}`)
        .update(userDetails)
        .then(() =>
            response.status(200).json({
                message: `Details for ${request.user.handle} added successfully`,
            })
        )
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
};

// get authenticated user's details
exports.getAuthUser = (request, response) => {
    let userDetails = {};

    db.doc(`/users/${request.user.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userDetails.credentials = doc.data();
                return db
                    .collection("likes")
                    .where("userHandle", "==", request.user.handle)
                    .get();
            }
        })
        .then(likesSnapshot => {
            userDetails.likes = [];

            likesSnapshot.forEach(likeDoc =>
                userDetails.likes.push(likeDoc.data())
            );
            return db
                .collection("notifications")
                .where("recipient", "==", request.user.handle)
                .orderBy("createdAt", "desc")
                .limit(10)
                .get();
        })
        .then(notificationsSnapshot => {
            userDetails.notifications = [];
            notificationsSnapshot.forEach(notificationDoc => {
                userDetails.notifications.push({
                    notificationId: notificationDoc.id,
                    ...notificationDoc.data(),
                });
            });
            return response.json(userDetails);
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
};

// get any user's details
exports.getUserDetails = (request, response) => {
    let userDetails = {};

    // get user data from DB and store to variable
    db.doc(`/users/${request.params.handle}`)
        .get()
        .then(userDoc => {
            if (userDoc.exists) {
                userDetails.user = userDoc.data();

                // get user's screams
                return db
                    .collection("screams")
                    .where("userHandle", "==", request.params.handle)
                    .orderBy("createdAt", "desc")
                    .get();
            } else
                return response.status(404).json({ error: "User not found" });
        })
        .then(screamsSnapshot => {
            userDetails.screams = [];

            screamsSnapshot.docs.forEach(screamDoc => {
                userDetails.screams.push({
                    screamId: screamDoc.id,
                    ...screamDoc.data(),
                });
            });

            return response.json(userDetails);
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
};

// mark notifications as read
exports.markNotificationsRead = (request, response) => {
    // create a new batch
    let batch = db.batch();

    // get each notification id from the request
    request.body.forEach(notificationId => {
        // use the notification id to get the corresponding document from Firestore
        const notificationDoc = db.doc(`/notifications/${notificationId}`);
        // perform update
        batch.update(notificationDoc, { read: true });
    });

    // commit batch operation
    batch
        .commit()
        .then(() => response.json({ message: "Notifications marked read" }))
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
};
