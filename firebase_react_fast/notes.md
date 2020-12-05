# Firebase + React CRUD Application
We are going to implement crud using firebase as backend


## Overview 
Crud app based on Contact info of individuals


## Setup
- Create React App
- Create Firebase Project
- Create File to store Firebase Project config -> firebase.js in root of React project directory

```js
import * as firebase from 'firebase';

var firebaseConfig = {
    apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "react-project-tut.firebaseapp.com",
    databaseURL: "https://react-project-tut-default-rtdb.firebaseio.com",
    projectId: "react-project-tut",
    storageBucket: "react-project-tut.appspot.com",
    messagingSenderId: "ooooooooooooooo",
    appId: "1:ooooooooooooooo:web:oooooooooooooooooooo"
  };
  
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
```

- Install `firebase` npm package

## State in Functional Components
Our React App this time will use functional components.
To implement the use of states in functional components, we need to `import useState from 'react'`. How do we then create state variables? This is the syntax below:

```js
var [variable, setVarValue] = useState(defaultVarValue)
```
On the LHS the name of the state variable is given, then the name of the function that can update the state variable is given beside it. The default value of the state variable is passed as an argument to `useState`.

## building the form
To handle the onChange event of each input field, we need a function. This event handler updates the state variable responsible for holding the input field values of the form component. 

```js
const handleInputChange = e => {
    var {name, value} = e.target; // destructuring
    setValues({
        ...values,
        [name]: value
    })
}
```

Destructuring allows as to extract the values of certain object properties and set them as values when defining a variable. So in this case, 
```js
const persDetails = {
    name: "Machele",
    age: 19,
    height: "some metres",

}
var {name, age} = persDetails
```
The variable names that match with property names within `persDetails` will be assigned the values of those properties.

Coming back to `handleInputChange` which we implemented in our project, remember that the `setValues` is the name name we provided for the function that allows us to set the value for the `values` state variable. Within `setValues`, we spread the already existent values, then update the values using the current input value. To make it concurrent with the values in our state variable, we had to make the input fields have their `name` attributes equal to the property name representing that field in the state variable. Then to make sure that the `setValues` uses the `name` variable  within the function we wrap it within `[]`.

## form submit - Adding a single contact
To submit the form to Firebase we need to create an onSubmit event handler for the ContactForm component. Within the onSubmit event handler we need to call a function that would send data from the form fields to the DB to actually add a contact to the DB. This function, called `addOrEditContact`, should live in our parent component, `Contact` and not `ContactForm` - where the form itself is found. Then it is passed as a prop down to the ContactForm component. To access a prop from a functional component, it is passed as a parameter, `props`. 

```js
const ContactForm = (props) => {
    // props.propName;
}
```

### Creating our addOrEditContact function
This function is what stores contact info in our Firebase DB. So first we need a way to access that DB. So in our `Firebase.js` file, we need to export our database reference. 

According to [Google Firebase Docs](https://firebase.google.com/docs/reference/js/firebase.database.Reference) - 04/12/2020: 
>A Reference represents a specific location in your Database and can be used for reading or writing data to that Database location. You can reference the root or child location in your Database by calling firebase.database().ref() or firebase.database().ref("child/path"). 

```js
// Initialize Firebase
var firebaseDB = firebase.initializeApp(firebaseConfig);

// ? this reference points to the root of the DB
export default firebaseDB.database().ref()
```  

Then we import it where we want to access the DB.

```js
import { firebaseDb } from '../firebase';
```

`firebaseDb.child('contacts')` creates a new node within the database called `contacts` since there is no existing node within the database with that name. This actually adds a child path called contacts. So now the full path to that DB location is `https://react-project-tut-default-rtdb.firebaseio.com/contacts`. 

Now to add a recors to that path/node, we just call `push()` off the child reference, `contact`. Then the first argument is the record we are adding, and the second could be a callback function to catch errors.

So:

```js
// ContactForm.js
const handleFormSubmit = e => {
    e.preventDefault();
    props.addOrEditContact(values);
    // values is the state variable - an Object - that holds the current input field values of the form
}

// Contacts.js
const addOrEditContact = contactObject => {
    firebaseDb.child('contacts').push(contactObject, error => {
        if (error) console.log(error)
    })
}
```

## Retrieving Data from Firebase - Listing Contacts

### useEffect
`useState` helps us to create state variables whereas `useEffect` allows us to create callbacks for when the state changes.

`useEffect` is called after the DOM is rendered. It is similar to componentDidMount for class components when used like this - with an empty array as a second argument, just a callback:

```jsx
import React, {useState, useEffect} from 'react';

const SomeComponent = () => {
    var [x, setX] = useState(0);

    // useEffect(callbackFunc, [stateVars])
    useEffect(() => {
        // do something
    }, [])
    
}

```

`useEffect` can also be caused upon every single rerender when used like this, with no second argument:

```jsx
import React, {useState, useEffect} from 'react';

const SomeComponent = () => {
    var [x, setX] = useState(0);

    // useEffect(callbackFunc, [stateVars])
    useEffect(() => {
        // do something
    })
    
}

```

In another case, `useEffect` calls the callback function passed as the first argument when the state variable found in the second argument Array changes.

```js
import React, {useState, useEffect} from 'react';

const SomeComponent = () => {
    var [x, setX] = useState(0);

    // useEffect(callbackFunc, [stateVars])
    useEffect(() => {
        // do something
    }, [x]) 
}
```

### Firebase DataSnapshot
A DataSnapshot is data retrieved from a location in our Firebase DB.

[Google Firebase Docs](https://firebase.google.com/docs/reference/js/firebase.database.Reference) - 04/12/2020:
> A DataSnapshot is passed to the event callbacks you attach with `on()` or `once()`. You can extract the contents of the snapshot as a JavaScript object by calling the `val()` method. Alternatively, you can traverse into the snapshot by calling `child()` to return child snapshots (which you could then call `val()` on). A DataSnapshot is an efficiently generated, immutable copy of the data at a Database location. It cannot be modified and will never change (to modify data, you always call the `set()` method on a Reference directly).

Reading data from the Firebase DB. We call the `on()` or `once()` function - a sort of event handler - off a DB reference. `on()` is realtime, and calls the callback, second argument, eachtime data changes in the DB, limited to the specification of its first argument. `once()` calls the callback only once. `once()` is ideal for retrieving data as it is from the DB at a certain time.

```js
var [contactObjects, setContactObjects] = useState({})

// get contacts from DB
useEffect(() => {
    firebaseDb.child('contacts').on('value', snapshot => {
        if (snapshot.val()) {
            setContactObjects({
                ...snapshot.val()
            })
        }
    })
})
```

The data is returned from the db as a Javascript object when `val()` is called off the returned snapshot. 
```jsx
// if we had this,
var [contactsArray, setcontactsArray] = useState({})

useEffect(() => {
    firebaseDb.child('contacts').on('value', snapshot => {
        if (snapshot.val()) {
            setcontactsArray({
                ...snapshot.val()
            })
        }
    })
})

// then
{
    contactsArray.map(contactObject => {
        return (
            <tr>
                <td>{contactObject.fullName}</td>
                <td>{contactObject.mobile}</td>
                <td>{contactObject.email}</td>
            </tr>
        )
    })
}

```

It is an Object of Objects. Supposing it was an Array which we wanted to render its values in a div, we could have used the map function. But since its an Object we use instead, `Object.keys()`. This returns all the keys from the Object collection in an Array. Then we call the map off the returned Array of keys. So instead we do,
```jsx
// We have this,
var [contactObjects, setcontactObjects] = useState({})

useEffect(() => {
    firebaseDb.child('contacts').on('value', snapshot => {
        if (snapshot.val()) {
            setcontactObjects({
                ...snapshot.val()
            })
        }
    })
})


// so
{
    Object.keys(contactObjects).map(id => {
        return (
            <tr>
                <td>{contactObjects[id].fullName}</td>
                <td>{contactObjects[id].mobile}</td>
                <td>{contactObjects[id].email}</td>
            </tr>
        )
    })
}
// where id is the id of each contactObject from the DB

```

It is important to provide a `key`, in React, when listing elements.

## Updating Records
We provide action buttons for update and delete (pencil and trash can icons) beside each record. To update a record we need to add a click event handler to the pencil such that it populates the form with the corresponding details of the record from which the update icon was clicked.

So first, we create a new state variable to hold the current id of the record (contact) which is currently open for editing or deletion. Then we let the click event handler for the pencil button set that state variable to the id of the contact where it was clicked. 
```jsx
// contact ID state variable
var [currentContactId, setcurrentContactId] = useState('');

// Pencil HTML Element
<a className="btn text-primary" onClick={setcurrentContactId(id)}>
    <i className="fas fa-pencil-alt"></i>
</a>
```

Then in order to populate the form, we pass the current id and contactObjects collection as props. Props can also be passed using jsx syntax.
```jsx

```