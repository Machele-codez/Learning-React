// check if a string is empty
const isEmpty = string => {
    if (string.trim() === "") return true;
    return false;
};

// check if email is valid
const isEmail = email => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(emailRegEx)) return true;
    return false;
};

exports.validateSignupData = userData => {
    // ? errors Object
    let errors = {};

    // ? email validation
    // check for empty email input
    if (isEmpty(userData.email)) errors.email = "Must not be empty";
    // check for valid email
    else if (!isEmail(userData.email))
        errors.email = "Must be a valid email address";

    // ? password validation
    // check for empty password input
    if (isEmpty(userData.password)) errors.password = "Must not be empty";
    // check password length
    else if (userData.password.length < 6)
        errors.password = "Must exceed 6 characters";

    // check for matching password and confirm password fields
    if (userData.password !== userData.confirmPassword)
        errors.confirmPassword = "Passwords must match";

    // ? handle validation
    // check for empty handle input value
    if (isEmpty(userData.handle)) errors.handle = "Must not be empty";

    // ? return errors if any
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false,
    };
};

exports.validateLoginData = user => {
    let errors = {};

    // ? validate inpute values
    if (isEmpty(user.email)) errors.email = "Must not be empty";
    if (isEmpty(user.password)) errors.password = "Must not be empty";

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false,
    };
};
