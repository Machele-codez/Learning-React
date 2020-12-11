import React, { useEffect, useState } from 'react';

import ContactForm from './ContactForm';

import firebaseDb from '../firebase';

const Contacts = () => {

    var [contactObjects, setContactObjects] = useState({});
    var [currentContactID, setcurrentContactID] = useState('');

    // get contacts from DB
    useEffect(() => {
        firebaseDb.child('contacts').on('value', snapshot => {
            if (snapshot.val()) {
                setContactObjects(snapshot.val())
            }
        })
    }, [])

    // add or edit a contact - DB operation
    const addOrEditContact = contactObject => {
        // edit existing contact
        if (currentContactID)
            firebaseDb.child(`contacts/${currentContactID}`).set(contactObject, error => {
                if (error) console.log(error)
                // if contact is edited successfully, reset currentContactID state variable
                else setcurrentContactID('')
            })
        // add new contact
        else
            firebaseDb.child('contacts').push(contactObject, error => {
                if (error) console.log(error)
            })
    }

    // delete contact
    const deleteContact = contactID => {
        // confirm delete action
        if (window.confirm("Are you sure you want to delete this contact?")) {
            // delete from DB
            firebaseDb.child(`contacts/${contactID}`).remove(error => {
                error ? console.log(error) : setcurrentContactID('')
            })
        }
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
                    <ContactForm {...{ addOrEditContact, contactObjects, currentContactID }} />
                </div>
                <div className="col-md-7">
                    <table className="table table-borderless table-striped">
                        <thead className="thead-light">
                            <tr>
                                <th>Full Name</th>
                                <th>Mobile</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                Object.keys(contactObjects).map(id => {
                                    return (
                                        <tr key={id}>
                                            <td>{contactObjects[id].fullName}</td>
                                            <td>{contactObjects[id].mobile}</td>
                                            <td>{contactObjects[id].email}</td>
                                            <td>
                                                <a className="btn text-primary" onClick={() => setcurrentContactID(id)}>
                                                    <i className="fas fa-pencil-alt"></i>
                                                </a>
                                                <a className="btn text-danger" onClick={() => deleteContact(id)}>
                                                    <i className="fas fa-trash-alt"></i>
                                                </a>
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Contacts;