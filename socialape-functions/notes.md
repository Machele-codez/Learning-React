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

This is definitely not from me. It has to be an error from the firestore package itself. So what did I do? I had to downgrade my `firebase-admin` and `firebase-functions` to a version that didn't have these bugs (firebase-admin: ^8.10.0, firebase-functions: ^3.6.1). Thanks to [Marcel Hoekstra](https://stackoverflow.com/questions/64575650/firebase-functions-error-after-update-what-can-i-do#comment114208082_64575650).

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

## User Profile Image upload with Busboy

So we create a post route for this too. And our handler responsible for uploading our image will use an npm package called `busboy`. We'll also need a few other packages so within our handler we'd have;

```js
const BusBoy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
```

Busboy is an npm package that parses HTML form data. For starters, we need to initialize it to be able to use it. This is done by creating a new instance of `BusBoy` and passing the request's headers as the `options` parameter.

```js
const busboy = new BusBoy({ headers: request.headers });
```

### Preparing for Upload

Busboy can be used to access form data for both form file input fields and form non-file input fields. Busboy uses its own events to access the form data. For file input fields, the `file` event is triggered for each file input field whereas for non-file input fields such as text and email, the `field` event is triggered.

In our case we'll be working with the `file` event since we are uploading an image. So when it is triggered we have access to some 5 parameters that are passed with the event. Our `file` event handler can access the `fieldname`, `file`, `filename`, `encoding`, and `mimetype` parameters of the file from the form input.

-   _fieldname_: The `name` attribute of the HTML form's input field via which the file is uploaded.
-   _file_: Represents the actual file that was placed in the form's input field. This parameter actually represents a `stream`.
-   _filename_: Name of the uploaded file.
-   _encoding_: file encoding.
-   _mimetype_: mimetype.

```js
busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {});
```

Though we might not use the `encoding` parameter, its better to leave it there since we are using positional arguments.

When uploading our image to Google Cloud Storage, we'll need:

-   the file path to specify the file to be uploaded
-   mimetype to specify the file's type.
    Therefore, we need to prepare those two first. And the place we have access to these requirements is within our `file` event handler.

So, we need to prepare a file that would contain the same contents as the file the user uploaded through the HTML form. This is because we need a filepath to be able to upload a file. But the user-uploaded file has no path. So first we get the file extension like this:

```js
// Well, we split the file name of the image (which is a string) and get the last element of the Array.
const imageExtension = filename.split(".")[filename.split(".").length - 1];
```

Then we can give the file a random name and add its extension.

```js
const imageFileName = `${Math.round(
    Math.random() * 10000000000
)}.${imageExtension}`;
```

Now let's create a path where our file will reside. Since we are using Google Cloud Functions, our only option, where we can write info to, is an in-memory directory called `/tmp`. So we access it using `os.tmpdir()`. So now that we have a temporary directory to store the file, we complete the path by adding the filename we created. This is done using `path.join()`.

```js
const filepath = path.join(os.tmpdir(), imageFileName);
```

Now we have only created a file path on GCF's memory with no actual file yet, we need the uploaded file to actually exist in that path. So what we do is to pipe the readable uploaded file stream into a writable stream on that path.

What is a stream, piping?

Well, in Node JS a stream represents a lot of stuff such as HTTP requests and responses, files, stdin, stderr, stdout, etc. These streams can either be readable, writable, duplex, or transform. So you get the meaning. The streams API allows us to write all data from one readable stream to a writable stream via a method called `piping`.

How does this help us?

In our case, the user-uploaded file is a readable stream. And we can create a writable stream in our temporary path using
`fs.createWriteStream`. So we create a writable stream with our created filename and path and then pipe the uploaded file into the newly created stream.

```js
uploadedFile.pipe(fs.createWriteStream(tempFilePath));

// or much simpler
// creating a writable stream
const tempFileStream = fs.createWriteStream(tempFilePath);
// pipe uploaded file into writable stream
uploadedFile.pipe(tempFileStream);
```

Then we store the required parameters for the Google Cloud Storage upload, the file name and mimetype, in an object for later access.

```js
imageToBeUploaded = { filepath, mimetype };
```

### Uploading file to Storage Bucket

Now that we have what is necessary, we create another event handler within which we actually perform the file upload. This event is the busboy's `finish` event. It is triggered after the data has been parsed by the `field` and `file` event handlers. Here, we make a call to our storage bucket with the filepath of the image to be uploaded.

```js
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
    });
```

Then on a successful upload, we update the user's Firestore instance's imageURL field to the URL of the uploaded image in the storage bucket (which is the user's profile image).

```js
.then(() => {
    const imageURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;

    return db.doc().collection(`/users/${request.user.handle}`).update({ imageURL });
    // The reason why we can access request.user from here is that this route also uses
    // the firebase authentication middleware we built in which we define request.user
})
```

And then

```js
.then(() => {
    return response.json({message: "Image uploaded successfully"})
})
.catch(error => {
    console.error(error);
    return response.status(500).json({ error: error.code })
})
```

Finally to finish the whole process we add:

```js
busboy.end(request.rawBody);
```

Since busboy itself is also a stream, the `busboy.end(request.rawBody)` writes `request.rawBody` as the last thing to the busboy stream and then denies further writing. It is necessary because when I omitted it the request kept on pending.

We have been able to copy the uploaded file into a memory location of our cloud function. Then from that memory location, we upload the file to Google Cloud Storage. Finish!

## Adding extra User Details

This is also going to be a protected POST route. In this route, before sending the raw user details provided from the HTML form to the database, we first make sure we do not send any empty values. So, if a particular field is populated with no value, then it is not added to the request to store these extra details in the database. This kind of filtering functionality is done by a helper function we create ourselves.

```js
exports.filterUserDetails = rawUserDetails => {
    // object to hold final result
    const filteredUserDetails = {};

    if (!isEmpty(rawUserDetails.bio))
        filteredUserDetails.bio = rawUserDetails.bio.trim();

    if (!isEmpty(rawUserDetails.location))
        filteredUserDetails.location = rawUserDetails.location.trim();

    if (!isEmpty(rawUserDetails.website)) {
        // prepend http protocol to user provided links with missing protocols.
        if (rawUserDetails.website.trim().substring(0, 4) !== "http")
            filteredUserDetails.website = `http://${rawUserDetails.website.trim()}`;
        else filteredUserDetails.website = rawUserDetails.website.trim();
    }

    return filteredUserDetails;
};
```

So the website field is not just checked for emptiness, but this filter function makes sure to prepend an HTTP protocol to user-provided links to their websites in the case where they didn't add it themselves.

After filtering, the data is ready for Firestore.

```js
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
```

## Getting User Details

This route is going to trigger DB calls that should return the details of the authenticated user that made the request. The route is a GET route and should return user-specific details which would be referred to as 'credentials'. It should also return info pertaining to the screams which the user has 'liked'.

To begin, we initialize an empty Object that would hold the data we get from our Firestore calls.

```js
let userDetails = {};
```

Then we make a firestore call to retrieve the document that holds the data of the authenticated user. This will return a 'DocumentSnapshot'. Call `exists()` off the returned snapshot to ensure it exists then proceed. The document snapshot contains all the fields that hold the info about the user. `DocumentSnapshot.data()` function is called off this to retrieve the user credentials and store them in our `userDetails` Object.

```js
db.doc(`/users/${request.user.handle}`)
    .get()
    .then(doc => {
        if (doc.exists) {
            userDetails.credentials = doc.data();
        }
```

Now, to get the liked posts by our user, we call the `likes` subcollection in the user's document. The returned 'QuerySnapshot' is an Array. Loop through it and store the like subdocuments in `userDetails.likes`.

```js
db.collection("likes")
    .where("userHandle", "==", request.user.handle)
    .get()

    .then(likesSnapshot => {
        userDetails.likes = [];

        likesSnapshot.forEach(likeDocArray =>
            userDetails.likes.push(likeDocArray.data())
        );
        return response.json(userDetails).status(200);
    });
```

Remember to handle errors using `.catch()`

## Get a Single Scream

To get a single scream we'll need an identifier to specify the scream. So we pass that as a URL parameter in our express route.

```js
app.get("/scream/:screamId", getScream);
```

As seen, `:screamId` above is the name of the URL parameter. This will not be a protected route since there is no need for that.

Let's move on to the route handler definition.

We first of all define an empty object, `screamData`, to hold the data to be retrieved. Then, we make a call to get the scream data using the scream id passed as a URL parameter.

```js
let screamData = {};

db.doc(`/screams/${request.params.screamId}`)
    .get()
    .then(doc => {
        if (!doc.exists)
            return response
                .status(404)
                .json({ message: "Scream not found" });

        screamData = doc.data();
        screamData.screamId = doc.id;
    }
```

Now, to get the comments on the scream, we make a separate call to the 'comments' collection which is also a separate one. Then we filter our query to match the comments that have their 'screamId' fields matching with the scream id passed in the URL. The comments are sorted by the date they were created, 'createdAt'. So the returned comments are pushed into the `screamData` object as well.

```js
return db
    .collection("/comments")
    .where("screamId", "==", request.params.screamId)
    .orderBy("createdAt", "desc")
    .get()
    .then(comments => {
        screamData.comments = [];

        comments.forEach(commentSnapshot =>
            screamData.comments.push(commentSnapshot.data())
        );

        return response.status(200).json(screamData);
    });
```

The populated `screamData` is returned in the response on a successful request.

## Post a Comment

This is also a protected route and so we add the firebaseAuthenticationMiddleware here too. Now, when posting a comment we'd like to add the profile image URL of the user who made that comment so that we can show the profile image in the UI with the user's comment. So we need a way to access the commment. As at the moment, the only way would be to make a separate DB call to get the current user's imageURL field value. But that would count against are quota for each comment being made on a scream even if it is by the same user. That's very inefficient.

To solve our problem alternatively, let's modify the firebaseAuthenticationMiddleware to include the user's imageURL in `request.user`. This means that once the user is authenticated, we have access to the imageURL field within all protected routes.

```js
// ? /util/firebaseAuthenticationMiddleware.js

// return extra user details found in user's Firestore document
return db
    .collection("/users")
    .where("userId", "==", request.user.uid)
    .limit(1)
    .get()
    .then(data => {
        // adding handle property to request.user
        request.user.handle = data.docs[0].data().handle;
        // adding imageURL property to request.user
        request.user.imageURL = data.docs[0].data().imageURL;

        return next();
    });
```

So within our `commentOnScream` handler, responsible for creating comments, we create a new comment Object after validating the body from user input.

```js
// validate for non-empty comment body
if (!request.body.body.trim())
    return response.status(400).json({ error: "Must not be empty" });

// comment Object
const newComment = {
    body: request.body.body.trim(),
    createdAt: new Date().toISOString(),
    screamId: request.params.screamId,
    userHandle: request.user.handle,
    userImageURL: request.user.imageURL,
};
```

Then after making sure that our scream exists, we add the new comment (i.e the `newComment` Object) to the comments subcollection within the scream document.

```js
db.doc(`/screams/${request.params.screamId}`)
    .get()
    .then(doc => {
        if (!doc.exists)
            return response.status(404).json({ error: "Scream not found" });

        return db.collection("comments").add(newComment);
    })
    .then(() => response.json(newComment))
    .catch(error => {
        console.error(error);
        response.status(500).json({ error: "Something went wrong" });
    });
```

## Likes and Unlikes

It seems more sensible to store each scream's likes and comments within the same scream's document. But when dealing with databases it is good practice to keep each record small. Also, Firebase has a limit of 4MB per document so there is a need to separate what can safely be, especially in this case where a single scream can have thousands of likes and comments. Plus, it helps in making queries more efficient.

The likes are therefore going to be stored in a separate collection. Each like document would have two fields for now, the `userHandle` and the `screamId`. This is how the like document structure would be.

```json
likes: [
        {
            userHandle: "userone_handle",
            screamId: "scream2439114nlfjo23u0jf",
        },
        {
            userHandle: "usertwo_handle",
            screamId: "screamr208f9j2390j20cmwi",
        }
    ],
```

The `userHandle` is already part of an authenticated user's request. The `screamId` is a URL parameter.

So when the `likeScream` handler route is hit; we first make sure that the scream id passed as a URL parameter actually belongs to an existing scream in the DB. Then, we store the scream document to a variable defined earlier (`screamData`). Then make a request to get the like document too.

```js
let screamData;

// like document from db with details matching that in request
const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", request.user.handle)
    .where("screamId", "==", request.params.screamId)
    .limit(1);

// scream document from db with details matching that in request
const screamDocument = db.doc(`/screams/${request.params.screamId}`);

screamDocument.get().then(screamDoc => {
    // if scream exists
    if (screamDoc.exists) {
        // extract data to variable
        screamData = screamDoc.data();
        screamData.screamId = screamDoc.id;

        // make a request to get like document
        return likeDocument.get();
    } else return response.status(404).json({ error: "Scream not found" });
});
```

The request to get the like document also resolves to a promise. So we handle it in a `.then()`. If the like document exists then we return an error stating that we cannot like the same scream again. If it doesn't exist then we create the like document.

```js
.then(likeDocArray => {
    if (likeDocArray.empty) {
        db.collection("likes")
            .add({
                userHandle: request.user.handle,
                screamId: request.params.screamId,
            })
    }
})
```

After creating the like document in the database, we need to update the like count of the scream. So we attach that after the `db.collection('likes').add()` resolves. And then we finally return the `screamData` which holds all info about the liked scream.

```js
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
    return response.status(400).json({ error: "Scream already liked" });
}
```

Conversely, to unlike a scream would be very similar. The difference would be that we have to make a request to the like collection expecting that the queried like exists. Then, we delete it.

```js
.then(likeDocArray => {
    if (likeDocArray.empty)
        return response.status(400).json({ error: "Scream not liked" });
    else {
        // delete like document from DB
        return (
            db
                .doc(`/likes/${likeDocArray.docs[0].id}`)
                .delete()
                // decrease like-count of scream
                .then(() => {
                    screamData.likeCount--;
                    return screamDocument.update({
                        likeCount: screamData.likeCount,
                    });
                })
                .then(() => response.json(screamData))
        );
    }
    })
```

## Deleting a Scream