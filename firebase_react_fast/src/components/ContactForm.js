import React, { useState } from 'react'

const ContactForm = (props) => {

    const initialFieldValues = {
        fullName: '',
        mobile: '',
        email: '',
        address: '',
    }

    var [values, setValues] = useState(initialFieldValues);

    const handleInputChange = e => {
        var {name, value} = e.target;
        
        setValues({
            ...values,
            [name]: value
        })
    }

    const handleFormSubmit = e => {
        e.preventDefault();
        props.addOrEditContact(values);
        setValues(initialFieldValues);
    }

    // hook that populates form depending on whether a contact has been selected for edit
    React.useEffect(() => {
        // if a contact has been selected to edit
        // thus, the state variable currentContactID has been populated with that contact's ID
        // then set the form field values using that contact's details
        if (props.currentContactID)
            setValues({
                ...props.contactObjects[props.currentContactID]
            })
        // else reset the form field values
        else
            setValues(initialFieldValues)
    }, [props.contactObjects, props.currentContactID])
    
    return (
        <form autoComplete="off" onSubmit={handleFormSubmit}>
            <div className="form-group input-group">
                <div className="input-group-prepend">
                    <div className="input-group-text">
                        <i className="fas fa-user"></i>
                    </div>
                </div>
                <input className="form-control"
                    placeholder="Full Name" name="fullName"
                    value={values.fullName}
                    onChange={handleInputChange}
                />
            </div>

            <div className="form-row">
                <div className="form-group input-group col-md-6">
                    <div className="input-group-prepend">
                        <div className="input-group-text">
                            <i className="fas fa-phone"></i>
                        </div>
                    </div>
                    <input className="form-control"
                        placeholder="Mobile" name="mobile"
                        value={values.mobile}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group input-group col-md-6">
                    <div className="input-group-prepend">
                        <div className="input-group-text">
                            <i className="fas fa-envelope"></i>
                        </div>
                    </div>
                    <input className="form-control"
                        placeholder="Email" name="email"
                        value={values.email}
                        onChange={handleInputChange}
                    />
                </div>
            </div>

            <div className="form-group">
                <textarea className="form-control" 
                    name="address" 
                    placeholder="Address"
                    value={values.address}
                    onChange={handleInputChange} 
                />
            </div>
            <div className="form-group">
                 <input type="submit"
                    className={ (props.currentContactID ? "btn-success" : "btn-primary") + " btn btn-block" } 
                    value={ props.currentContactID ? "Update" : "Save" }
                 />
            </div>

        </form>
    )
}

export default ContactForm;