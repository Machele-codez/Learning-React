import React from "react";

import axios from "axios";

import Grid from "@material-ui/core/Grid";
import Scream from "../components/Scream";

export class home extends React.Component {
    // initial state
    state = {
        screams: null,
    };

    componentDidMount() {
        // get screams from Firestore
        axios
            .get("/screams")
            .then(res => {
                console.log(res.data);
                this.setState({ screams: res.data });
            })
            .catch(err => {
                this.setState({ screams: "error" });
                console.error(err);
            });
    }

    render() {
        // JSX markup for screams
        let recentScreamsMarkup = this.state.screams ? (
            this.state.screams !== "error" ? (
                // loop through all screams in the state and return their markup
                this.state.screams.map(scream => <Scream key={scream.screamId} scream={scream} />)
            ) : (
                <p>Error loading screams</p>
            )
        ) : (
            <p>Loading...</p>
        );

        return (
            <Grid container spacing={2}>
                <Grid item sm={8} xs={12}>
                    {recentScreamsMarkup}
                </Grid>
                <Grid item sm={4} xs={12}>
                    Profile..
                </Grid>
            </Grid>
        );
    }
}

export default home;
