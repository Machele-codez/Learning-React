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

class login extends React.Component {
    // state
    constructor() {
        super();
        this.state = {
            email: "",
            password: "",
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
        const userCreds = {
            email: e.target.email.value,
            password: e.target.password.value,
        };

        axios
            .post("/login", userCreds)
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
                            Login
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
                                name="password"
                                id="password"
                                label="Password"
                                type="password"
                                value={this.state.password}
                                fullWidth
                                noValidate
                                onChange={this.handleChange}
                                className={classes.inputField}
                                helperText={errors.password}
                                error={Boolean(errors.password)}
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
                                disabled={loading}
                            >
                                {loading ? (
                                    <CircularProgress
                                        className={classes.submitButtonLoader}
                                        size={25}
                                    />
                                ) : (
                                    "Login"
                                )}
                            </Button>
                            <Typography variant="body1">
                                Don't have an account? Signup{" "}
                                <Link to="/signup">here</Link>
                            </Typography>
                        </form>
                    </Grid>
                    <Grid item sm />
                </Grid>
            </div>
        );
    }
}

login.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(login);
