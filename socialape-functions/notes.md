# Firebase

Firebase is a backend-as-a-service (Baas) that comes with a lot of features that basically allows backend devs to write less code to get more done. Firebase lives on the cloud and so removes the need to buy some VPS or dedicated servers when deploying our applications. For the `socialape` project, which is a kind of social media site, we use Firebase as our backend. It is going to be responsible for our database, file storage and authentication.

# Firebase Databases - Real Time Database / Firestore

Both are realtime databases. The Firebase Real Time Database was developed first. Firestore is a build up on this. Firestore is more scalable. They both have different pricing. This project uses Firestore. Real Time Database returns data from the database in one big pile of JSON. Therefore querying and filtering is not very pleasant. On the other hand, Firestore uses collections and documents (MongoDB style) to store data and so allow complex queries and filtering of results from the DB.

# Firebase Cloud Functions

Firebase as we mentioned, is a BaaS. But sometimes there is the need not only to fetch and push data to the DB. Sometimes, we might want to perform some calculations, resize some photos, validate some text before we send them to the DB (these are just a few use cases). Cloud functions allow us to do just that. They are actually server side code written in Node.js but are rather hosted by Firebase on the cloud and connected to our apps as an API. So no need to stress over scaling servers, security and all the nuisance that comes with managing a server. Cool Right?

## Setup and Execution

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

# Reading Data from Firestore DB

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

# Creating A Scream

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

# Express.js

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
            console.log(data);

            let screams = [];
            // data is a QuerySnapshot Object
            data.forEach(doc => screams.push(doc.data()));
            // return Array of documents
            return response.json(screams);
        })
        // handle error
        .catch(error => console.error(error));
});

// export all routes defined by the Express app with as /api/<route>
exports.api = functions.https.onRequest(app);

``` 