import "./App.css";
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import themeFile from "./util/theme";

// Pages
import home from "./pages/home";
import login from "./pages/login";
import signup from "./pages/signup";

// Components
import Navbar from "./components/Navbar";

// Material UI
import { ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";

import jwtDecode from "jwt-decode";

// Theme for Project
const theme = createMuiTheme(themeFile);

let authenticated;
// get auth token from local storage
const token = localStorage.FBIdToken;
// check if token is authenticated
if (token) {
    const decodedToken = jwtDecode(token);

    if (Date.now() > decodedToken.exp * 1000) {
        authenticated = false;
        window.location.href = "/login";
    } else {
        authenticated = true;
    }
}

class App extends React.Component {
    render() {
        return (
            <MuiThemeProvider theme={theme}>
                <Router>
                    <Navbar />
                    <div className="container">
                        <Switch>
                            <Route exact path="/" component={home} />
                            <Route exact path="/signup" component={signup} />
                            <Route exact path="/login" component={login} />
                        </Switch>
                    </div>
                </Router>
            </MuiThemeProvider>
        );
    }
}

export default App;
