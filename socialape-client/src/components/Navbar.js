import React from "react";

import { Link } from 'react-router-dom';
 
// Material UI
import Appbar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Toolbar from "@material-ui/core/Toolbar";

export class Navbar extends React.Component {
    render() {
        return (
            <Appbar>
                <Toolbar className="nav-container">
                    <Button color="inherit" component={Link} to="/">Home</Button>
                    <Button color="inherit" component={Link} to="/login">Login</Button>
                    <Button color="inherit" component={Link} to="/signup">Signup</Button>
                </Toolbar>
            </Appbar>
        );
    }
}

export default Navbar;
