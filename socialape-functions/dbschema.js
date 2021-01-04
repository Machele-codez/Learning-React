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
    comments: [
        {
            body: "Comment here, comment there, comments everywhere!",
            createdAt: "2020-12-10T10:08:08.710Z", // Date ISOString
            screamId: "6as4g51weg98ew4eqewfsa",
            userHandle: "Machele-codez",
        },
    ],
    users: [
        {
            userId: "79afsd465g98as7gs0",
            email: "goodman@thismail.com",
            handle: "goodman",
            createdAt: "2020-12-10T10:08:08.710Z", // Date ISOString
            imageURL: "images/profile/79afsd465g98as7gs0.jpg",
            website: "https://goodman.thefasi.com",
            bio: "Intellingent and rich",
            location: "Accranada, GH",
        },
    ],
    likes: [
        {
            userHandle: "goodman",
            screamId: "fasf645g948456684984qwe",
        },
    ],
};

const userDetails = {
    credentials: {
        // Redux Data
        userId: "79afsd465g98as7gs0",
        email: "goodman@thismail.com",
        handle: "goodman",
        createdAt: "2020-12-10T10:08:08.710Z", // Date ISOString
        imageURL: "images/profile/79afsd465g98as7gs0.jpg",
        website: "https://goodman.thefasi.com",
        bio: "Intellingent and rich",
        location: "Accranada, GH",
    },
    likes: [
        {
            user: "goodman",
            screamId: "fasf645g948456684984qwe",
        },
        {
            user: "goodman",
            screamId: "fasf645g948456684984qwe",
        },
    ],
};
