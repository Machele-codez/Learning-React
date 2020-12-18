const { admin, db } = require("./admin");

module.exports = (request, response, next) => {
    let idToken;
    if (
        request.headers.authorization &&
        request.headers.authorization.startsWith("Bearer ")
    ) {
        idToken = request.headers.authorization.split(" ")[1];
    } else {
        console.error("No token Found");
        return response.status(403).json({ error: "Unauthorized" });
    }

    // verify token
    admin
        .auth()
        .verifyIdToken(idToken)
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
        })
        .catch(error => {
            console.error("Error while verifying token ", error);
            return response.status(403).json(error);
        });
};
