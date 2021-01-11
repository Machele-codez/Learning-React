import React from 'react'

import Grid from "@material-ui/core/Grid";

export class home extends React.Component {
    
    
    
    render() {
        return (
            <Grid container spacing={2}>
                <Grid item sm={8} xs={12}>
                    Content...
                </Grid>
                <Grid item sm={4} xs={12}>
                    Profile..
                </Grid>
            </Grid>
        )
    }
}

export default home
