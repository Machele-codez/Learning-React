import { Route, Redirect } from "react-router-dom";

export default ({ component: Component, authenticated, ...rest }) => (
    <Route
        // pass all other props
        {...rest}
        render={props =>
            // if authenticated then redirect
            authenticated ? <Redirect to="/" /> : <Component {...props} />
        }
    />
);
