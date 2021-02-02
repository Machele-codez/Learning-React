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
import AuthRoute from "./util/AuthRoute";

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

    // if current datetime exceeds expiry date time, then set authenticated to false
    if (Date.now() > decodedToken.exp * 1000) {
        if (window.location.pathname !== "/login") window.location.href = "/login";
        authenticated = false;
    } else {
        authenticated = true;
    }
    console.log(authenticated ? "authenticated" : "not authenticated");
}

class App extends React.Component {
    render() {
        return (
            <MuiThemeProvider theme={theme}>
                <div className="App">
                    <Router>
                        <Navbar />
                        <div className="container">
                            <Switch>
                                <Route exact path="/" component={home} />
                                <AuthRoute
                                    exact
                                    path="/login"
                                    authenticated={authenticated}
                                    component={login}
                                />
                                <AuthRoute
                                    exact
                                    path="/signup"
                                    authenticated={authenticated}
                                    component={signup}
                                />
                            </Switch>
                        </div>
                    </Router>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default App;
