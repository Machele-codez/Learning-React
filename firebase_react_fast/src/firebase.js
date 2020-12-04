import firebase from 'firebase';

var firebaseConfig = {
    apiKey: "AIzaSyBhFKD8afPVBV6i2Z4tg1nG20mB8E-8aTU",
    authDomain: "react-project-tut.firebaseapp.com",
    databaseURL: "https://react-project-tut-default-rtdb.firebaseio.com",
    projectId: "react-project-tut",
    storageBucket: "react-project-tut.appspot.com",
    messagingSenderId: "545700584445",
    appId: "1:545700584445:web:50024799f2d83d86a25794"
  };
  
// Initialize Firebase
var firebaseDB = firebase.initializeApp(firebaseConfig);

// ? this reference points to the root of the DB
export default firebaseDB.database().ref()