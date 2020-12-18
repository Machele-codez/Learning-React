# Firebase

Firebase is a backend-as-a-service (Baas) that comes with a lot of features that basically allows backend devs to write less code to get more done. Firebase lives on the cloud and so removes the need to buy some VPS or dedicated servers when deploying our applications. For the `socialape` project, which is a kind of social media site, we use Firebase as our backend. It is going to be responsible for our database, file storage and authentication.

## Firebase Databases - Real Time Database / Firestore

Both are realtime databases. The Firebase Real Time Database was developed first. Firestore is a build up on this. Firestore is more scalable. They both have different pricing. This project uses Firestore. Real Time Database returns data from the database in one big pile of JSON. Therefore querying and filtering is not very pleasant. On the other hand, Firestore uses collections and documents (MongoDB style) to store data and so allow complex queries and filtering of results from the DB.

## Firebase Cloud Functions

Firebase as we mentioned, is a BaaS. But sometimes there is the need not only to fetch and push data to the DB. Sometimes, we might want to perform some calculations, resize some photos, validate some text before we send them to the DB (these are just a few use cases). Cloud functions allow us to do just that. They are actually server side code written in Node.js but are rather hosted by Firebase on the cloud and connected to our apps as an API. So no need to stress over scaling servers, security and all the nuisance that comes with managing a server. Cool Right?

### Setup and Execution

So to begin with, we install the Firebase CLI globally. `npm i -g firebase-tools`. For PowerShell, running scripts (which this firebase CLI is part of) is restricted. So we need to configure PowerShell to allow us to run the Firebase CLI script. How? We use

```shell
Set-ExecutionPolicy -Scope Process|CurrentUser|LocalMachine|UserPolicy|MachinePolicy -ExecutionPolicy Bypass|Unrestricted
```

Then we authenticate:

```shell
firebase login
```

Then we create our working directory, cd into it and initialize our backend app.

```shell
firebase init
```

I didn't have a credit card so I had to change the node runtime to version 8 in package.json

```json
"engines": {
    "node": "8"
},
```

A demo cloud function can be found in the index.js file under the `functions` directory.

```js
exports.helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});
```

This is how we'd be writing our functions I guess.
So after this we deploy our function.

```shell
firebase deploy
```

An API endpoint which can be used to access our cloud function is provided when deploy is complete. Hit the endpoint to run your function.

# Social Ape Project

## Reading Data from Firestore DB

So we created some dummy data in the DB in the Firestore console. Now we want to retrieve that data. So within `index.js` we have to first initialize the app. Initialization is done by the admin which we'd have to import. Imports are made using `require` since it's node.js code.

```js
const admin = require("firebase-admin"); // imports are done using the require keyword

admin.initializeApp(); // this is fine since our app has been defined in .firebaserc
```

Then we create a cloud function within which we use admin to access firestore.

```js
// getting screams from DB
exports.getScreams = functions.https.onRequest((request, response) => {
    // make firestore call to get data from screams collection
    // returns a Promise
    admin.firestore
        .collection("screams")
        .get()
        // handle returned Promise with data
        .then(data => {
            let screams = [];
            // data is an Array of documents
            data.forEach(doc => screams.push(doc.data()));
            // return Array of documents
            return response.json(screams);
        })
        // handle error
        .catch(error => console.error(error));
});
```

So yes the code explains but I get an error in my logs.

```
/srv/node_modules/@google-cloud/firestore/build/src/collection-group.js:54
    async *getPartitions(desiredPartitionCount) {
          ^

SyntaxError: Unexpected token *
    at createScript (vm.js:80:10)
    ...
```

This is definitely not from me. It has to be an error from the firestore package itself. So what did I do? I had to downgrade my `firebase-admin` and `firebase-functions` to a version that didn't have these bugs. Thanks to [Marcel Hoekstra](https://stackoverflow.com/questions/64575650/firebase-functions-error-after-update-what-can-i-do#comment114208082_64575650).

## Creating A Scream

So we create another cloud function for this. Then within, we create the scream object using the request body to populate the scream with necessary data

```js
exports.createScream = functions.https.onRequest((request, response) => {
    // create scream Object from request body
    const newScream = {
        userHandle: request.body.userHandle,
        body: request.body.body,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    };
});
```

`admin.firestore.Timestamp.fromDate(new Date())` creates a new Timestamp from the given date.

Then, we define our DB function to add the data to firestore.

```js
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
```

But if the request method is GET with no body, then an error would occur which we must handle so at the beginning of the function;

```js
if (request.method !== "POST")
    return response.status(400).json({ error: "Method not allowed" });
```

## Adding Express.js

Express allows us to manage routing way better in our backend. Instead of checking request methods within firebase cloud functions we rather define express routes. Then we can even export multiple routes with a single base url.

```js
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

// export all routes defined by the Express app with as /api/<route>
exports.api = functions.https.onRequest(app);
```

You can call `orderBy` off a collection to order it by a particular field within its documents. By default it orders in ascending order.

```js
admin.firestore().collection("collection_name").orderBy("fieldName", "desc");
```

For ease of use with JS we are going to modify the createdAt field to hold `ISOstrings` instead of `Timestamps`.

```js
const newScream = {
    userHandle: request.body.userHandle,
    body: request.body.body,
    createdAt: new Date().toISOString(),
};
```

## Database schema

This has no effect on our project but helps us to plan and understand the structure of our DB. We create a `dbschema.js` for this.

```js
let db = {
    screams: [
        {
            userHandle: "Machele-codez",
            body:
                "Some text that would be displayed as the body of our scream.",
            createdAt: "2020-12-10T10:08:08.710Z", // Date ISOString
            likeCount: 5,
            commentCount: 2,
        },
    ],
};
```

We add like and comment count fields to reduce the number of reads we make to Firestore which we are billed for.

## Changing Deployment Region

```jsx
exports.api = functions.region("europe-west2").https.onRequest(app);
```

where `europe-west2` is the desired region.

## Users

First authentication methods must be configured in our firebase console.
Then we download the `firebase` SDK and configure it with `firebase.initializeApp(config)`.

### Signup

We create a route for signing up. This route would be hit with body from the signup form. After validation, the firebase auth function is called to create a new user in the DB with email and password (as per our configuration)0.

```js
// TODO signup route
app.post("/signup", (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    };

    // ? Validate data

    // ? submit to firebase authentication backend
    firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
        .then(data =>
            response.status(201).json({
                message: `User ${data.user.uid} signed up successfully`,
            })
        )
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
});
```

### Extra User Info

Firebase doesn't allow us to store extra information about our users in the Authentication collection. So instead, we create a new collection in Firestore where we would store extra info about each user when needed. So we create a new `users` collection which will contain documents for each user. Each document's id will be the user's `handle` and will possess `email`, `createdAt`, and `userId` fields.

### Ensuring unique handles when signing up

When signing up, we need to ensure that an already used handle is not used to sign up again. So we modify the above code. After creating a `newUser` Object from the provided details, we first ensure that the handle is not already taken. So how exactly is it done?

1. First we check if the user exists in our `/users` collection.

```js
// database admin
const db = admin.firestore();

// access document with the following path
db.doc(`/users/${newUser.handle}`).get();
```

This tries to access the document with id of `newUser.handle` within the `/users` collection. `db.doc('path').get()` returns a DocumentSnapshot whether or not the document at the specified path exists. So we call a `.then()` which takes the snapshot, represented with `doc`, as an argument to do further checking. From there, within `.then()` we check if the document really exists in the database using `doc.exists` which returns a Boolean. So if the document exists, we return an error response informing that the handle has been taken.

Our error responses for particular form fields would have the name of the form field as key, and the error message as value.
`{ fieldName: "Error message" }`

```js
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
            }
        )
```

Good, so we've handled the error. What if the user does not exist? Simple! We proceed to create a new user with the given details.

```js
else {
    // if the handle is not taken
    // ? submit to firebase authentication backend
    return firebase
        .auth()
        .createUserWithEmailAndPassword(
            newUser.email,
            newUser.password
        );
}
```

Then we'll need to generate an auth token to authenticate requests to the DB on behalf of the user - signup results in logging in.

```js
// if the user is successfully created, generate auth token
.then(data => {
    return data.user.getIdToken();
})
```

Then we store the user's auth token in a variable, and create a document in the `/users` collection to hold the extra data of our user.

```js
// send auth token back in response and add extra user data to Firestore 'users' collection
.then(userAuthToken => {
    token = userAuthToken;
    // user data to be added to DB
    const userData = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
    };
    // adding user data to DB
    return db.doc(`/users/${userData.handle}`).set(userData);
})
.then(() => response.status(201).json({ token }))

// catch errors
.catch(error => {
    console.error(error);
    // handle existing email error
    if (error.code === "auth/email-already-in-use")
        return response.status(400).json({email: "email already in use"})
    // other errors
    return response.status(500).json({ error: error.code });
});
```

### Data Validation

This is done using helper functions just for cleaner code. Then all field errors are returned in an `errors` object. The validation is done in the backend - Cloud functions.

### Logging In

Logging in is done using `firebase.auth().signInWithEmailAndPassword(email, password)`. It also returns a promise of type `<UserCredentials>` just like `firebase.auth().createUserWithEmailAndPassword`. This `<UserCredentials>` contains the `user` property from which a token can be generated using `user.getIdToken()`.

### Authentication Middleware

Right now, anyone at all can post screams to our DB and can read the screams too. But we don't want that. We want to protect these and probably some other routes. We need to intercept the incoming requests, check a few things, then decide whether to accept the request or not. This kind of functionality is called **middleware**.
So in our case we want to add some authentication middleware to some routes to make sure that the user sending who sends a request to those routes is authenticated. Express allows us to do this by inserting our middleware, essentially some function(s), as an argument after the request path. Keep in mind that the function that takes just `request` and `response` as parameters and returns response objects is also middleware.

> Middleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application’s request-response cycle. The next middleware function is commonly denoted by a variable named next. If the current middleware function does not end the request-response cycle, it must call next() to pass control to the next middleware function. Otherwise, the request will be left hanging.

```js
app = require("express")();

app.post(
    "/somepath", // path
    myMiddlewareFunc, // middleware
    (req, resp) => resp.json({}) // this is also middleware
);
```

Our middleware function will check for the existence of the Bearer Authorization header. If it is not present then a 403 error is returned. If it exists the token would be extracted from it. Then we call `admin.auth().verifyIdToken(extractedToken)` which

> verifies a Firebase ID token (JWT). If the token is valid, the promise is fulfilled with the token's decoded claims; otherwise, the promise is rejected. An optional flag can be passed to additionally check whether the ID token was revoked.
> Then within a `.then()` we extract user data from the decoded token and add it to the request object. What do we add? First we add a `user` property to request and assign it the value of the decoded token. Then we also need to add the user's handle to the request object but the handle is not stored in the token's claims. So, using the user's uid, we make a DB call to the collection in firestore that holds extra user data. From there we get the user handle and add it as a property to `request.user` so it will be like `request.user.handle`.

```js
// verify token
admin
    .auth()
    .verifyIdToken()
    .then(decodedToken => {
        // add token to request object
        request.user = decodedToken;

        // getting user handle from DB - user handle is stored in a Firestore collection, not part of the decoded token
        return db
            .collection("/users")
            .where("userId", "==", request.user.uid)
            .limit(1)
            .get();
    })
    .then(data => {
        // adding handle property to request.user
        request.user.handle = data.docs[0].data().handle;
        return next();
    });
```

`data.docs` will be an array of the single document that matched the query.

`data.docs[0].data()` returns the fields of the document as an Object.

Now that the user's handle is part of the request object, we can extract it for use within our route that is responsible for posting screams. We assign the userHandle field of the new scream to `request.user.handle`.

## Refactoring and Organising our Code Structure

We create the directories under `socialape-functions/functions`. We create a `handlers` directory to keep our route handlers, `util` to keep our utilities.

```js
exports.funcName = () => {};
// is same as
export const funcName = () => {};
```
