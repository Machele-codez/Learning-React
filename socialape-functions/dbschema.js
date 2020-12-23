let db = {
    screams: [
        {
            userHandle: "Machele-codez",
            body: "Some text that would be displayed as the body of our scream.",
            createdAt: "2020-12-10T10:08:08.710Z", // Date ISOString
            likeCount: 5,
            commentCount: 2,
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
            screamId: "fasf645g948456684984qwe"
        },
        {
            user: "goodman",
            screamId: "fasf645g948456684984qwe"
        }
    ]
};