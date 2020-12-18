const { db } = require("../util/admin");

const firebase = require("firebase");
const firebaseConfig = require("../util/config");

firebase.initializeApp(firebaseConfig);

const { validateSignupData, validateLoginData } = require("../util/validators");

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
