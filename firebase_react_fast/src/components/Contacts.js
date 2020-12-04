import React from 'react';

import ContactForm from './ContactForm';

import firebaseDb from '../firebase';

const Contacts = () => {

    // get contacts from DB

    // add or edit a contact - DB operation
    const addOrEditContact = contactObject => {
        firebaseDb.child('contacts').push(contactObject, error => {
            if (error) console.log(error)
        })
    }

    return (
        <React.Fragment>
            <div className="jumbotron jumbotron-fluid">
                <div className="container">
                    <h1 className="display-4 text-center">Contact Register</h1>
                </div>
            </div>
            <div className="row">
                <div className="col-md-5">
                    <ContactForm addOrEditContact={addOrEditContact}/>
                </div>
                <div className="col-md-7">
                    <div>List of contacts</div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Contacts;