import React from "react";
import PropTypes from "prop-types";
import Link from "react-router-dom/Link";

import AppIcon from "../images/socialape-logo.png";

import withStyles from "@material-ui/core/styles/withStyles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import axios from "axios";

const styles = theme => ({ ...theme.styles });

class signup extends React.Component {
    // state
    constructor() {
        super();
        this.state = {
            email: "",
            password: "",
            confirmPassword: "",
            handle: "",
            loading: false,
            errors: {},
        };
    }

    // input field value change
    handleChange = e => {
        // update state variables to match input values
        this.setState({
            [e.target.name]: e.target.value,
        });
    };

    // form submit handler
    handleSubmit = e => {
        e.preventDefault();

        // set loading state to true
        this.setState({ loading: true });
        // user login data
        const newUserCreds = {
            email: e.target.email.value,
            handle: e.target.handle.value,
            password: e.target.password.value,
            confirmPassword: e.target.confirmPassword.value,
        };

        axios
            .post("/signup", newUserCreds)
            .then(response => {
                console.log(response.data);
                // set loading state to false
                this.setState({ loading: false });
                // store auth token
                localStorage.setItem("FBIdToken", response.data.token);
                this.props.history.push("/");
            })
            .catch(err =>
                this.setState({
                    loading: false,
                    errors: err.response.data,
                })
            );
    };

    render() {
        const { classes } = this.props;
        const { errors, loading } = this.state;

        return (
            <div>
                <Grid container className={classes.formContainer}>
                    <Grid item sm />
                    <Grid item sm>
                        <img
                            src={AppIcon}
                            alt="monkey"
                            className={classes.formHeaderImage}
                        />
                        <Typography variant="h4" className={classes.pageTitle}>
                            Signup
                        </Typography>
                        <form onSubmit={this.handleSubmit} noValidate>
                            <TextField
                                name="email"
                                id="email"
                                label="Email"
                                type="email"
                                value={this.state.email}
                                fullWidth
                                noValidate
                                onChange={this.handleChange}
                                className={classes.inputField}
                                helperText={errors.email}
                                error={Boolean(errors.email)}
                            />
                            <TextField
                                name="handle"
                                id="handle"
                                label="Handle"
                                type="text"
                                value={this.state.handle}
                                fullWidth
                                noValidate
                                onChange={this.handleChange}
                                className={classes.inputField}
                                helperText={errors.handle}
                                error={Boolean(errors.handle)}
                            />
                            <TextField
                                name="password"
                                id="password"
                                label="password"
                                type="password"
                                value={this.state.password}
                                fullWidth
                                noValidate
                                onChange={this.handleChange}
                                className={classes.inputField}
                                helperText={errors.password}
                                error={Boolean(errors.password)}
                            />
                            <TextField
                                name="confirmPassword"
                                id="confirmPassword"
                                label="Confirm Password"
                                type="password"
                                value={this.state.confirmPassword}
                                fullWidth
                                noValidate
                                onChange={this.handleChange}
                                className={classes.inputField}
                                helperText={errors.confirmPassword}
                                error={Boolean(errors.confirmPassword)}
                            />
                            {/* general errors */}
                            {errors.general && (
                                <Typography
                                    variant="body2"
                                    className={classes.generalFormError}
                                >
                                    {errors.general}
                                </Typography>
                            )}
                            {/* login button */}
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                className={classes.submitButton}
                            >
                                {loading ? (
                                    <CircularProgress
                                        className={classes.submitButtonLoader}
                                        size={25}
                                    />
                                ) : (
                                    "Signup"
                                )}
                            </Button>
                            <Typography variant="body1">
                                Already have an account? Login{" "}
                                <Link to="/login">here</Link>
                            </Typography>
                        </form>
                    </Grid>
                    <Grid item sm />
                </Grid>
            </div>
        );
    }
}

signup.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(signup);
