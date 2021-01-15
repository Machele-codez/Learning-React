This is the frontend client for the Social Ape Project. This is built using React and Material UI.

# Routing

The webapp is to appear to be made of multiple pages though its a single page application. To achieve this, we'll need to use routes to display different components depending on the URL path of our domain that is visited. A package called `react-router-dom` will help us achieve this.

```js
import { BrowserRouter as Router, Router, Switch } from "react-router-dom";
```

Within our main `App` component, we wrap everything within the `BrowserRouter` tag which we have imported as `Router`. Then, each route for each component is defined within the `Swtich` tag which is also a child of the `Router` tag. The `Switch` tag makes sure that only a single route is displayed for a matching URL. Therefore, if multiple routes match a particular URL that the user visits in the browser, instead of stacking contents of each route, `Switch` will cause only the first matching route to display its content. In effect;

```jsx
class App extends React.Component {
    render() {
        return (
            <Router>
                <Switch>
                    <Route exact path="/" component={home} />
                    <Route exact path="/signup" component={signup} />
                    <Route exact path="/login" component={login} />
                </Switch>
            </Router>
        );
    }
}
```

**NB:** With the way `Switch` works, it is useful to create 404 pages by giving it the `"/"` path and passing the `exact` parameter to other routes for specific pages. And then leaving the 404 route without the exact parameter. Then make sure to make the 404 route the last ddefined route. In this way, any page that matches an existing route would be rendered and would not even reach the next possible match (because of `Switch`). Any page that does not match a defined route would then match the 404 route.

```jsx
    render() {
        return (
            <Router>
                <Switch>
                    <Route exact path="/" component={home} />
                    <Route exact path="/about" component={about} />
                    {/* 404 Route */}
                    <Route path="/" render={() => <div>404</div>}
                    />
                </Switch>
            </Router>
        );
    }

```

# Navbar

Our navbar is going to contain useful links for navigating through our site. It will be developed using `material-ui`. A component is created for it. And since it is going to be present on all pages on the site it won't be placed within the `Switch` tags. Let's go ahead and import some components we'll need within `Navbar.js`.

```jsx
// Material UI
import Appbar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Toolbar from "@material-ui/core/Toolbar";
```

We import this way to keep the total bundle size minimal.

Our basic navbar structure starts this way

```jsx
<Appbar>
    <Toolbar>
        <Button color="inherit">Home</Button>
        <Button color="inherit">Login</Button>
        <Button color="inherit">Signup</Button>
    </Toolbar>
</Appbar>
```

## Navbar Position

The CSS `position` property of the navbar can be set using the `position` prop of the `Appbar` component. By default it is in a `fixed` position. Therefore, part of the rest of our content would be hidden behind the navbar. But this issue is resolved using css margin properties.

## Adding links to nav buttons

To create links in the navbar buttons, we pass `Link` from `react-router-dom` as a component to the buttons. This allows the `Button`s to take up the props of `Link`. Then we place the path for the link in the `to` prop.

```jsx
<Button color="inherit" component={Link} to="/">Home</Button>
<Button color="inherit" component={Link} to="/login">Login</Button>
<Button color="inherit" component={Link} to="/signup">Signup</Button>
```

# Retrieving and Displaying Screams

In our Home component, we need to display screams adjacent to the user profile. Retrieving the screams is done in the `componentDidMount` lifecycle method of the home React component. Every React component goes through three stages, mounting, updating, and unmounting. `componentDidMount` is the last method to be called, if defined, when a component is mounted. It is called after the component has been rendered in the DOM. Add a `proxy` to `package.json` which directs all API calls within the react app to the proxy defined.

```json
// package.json
{
    // ...
    "proxy": "https://path.to/firebase/backend/base-api-url"
}
```

Now we just add the rest of the path when making our api calls using `axios`.

So to get the screams, we make an API call using `axios`, to the endpoint that returns a JSON of all screams. Then we set a state variable called `screams` to hold the screams. The initial value of that (`screams`) state variable is `null`. So in the render method, we check if the `screams` state variable is null, in which case the request to Firestore is still loading and so we display a loader something. But if the `screams` state variable is populated (with screams), then we render the screams.

```jsx
// initial state
state = {
    screams: null,
};

// just after component renders with state
componentDidMount() {
    // get screams from Firestore
    axios
        .get("/screams")
        .then(res => {
            // update state
            this.setState({ screams: res.data });
        })
        .catch(err => console.error(err));
}

render() {
    // JSX markup for screams
    let recentScreamsMarkup = this.state.screams ? (
        // loop through all screams in the state and return their markup
        this.state.screams.map(scream => <p>{scream.body}</p>)
    ) : (
        // if no screams in state yet, probably request is not complete yet
        <p>Loading...</p>
    );

    return (
        <Grid container spacing={2}>
            <Grid item sm={8} xs={12}>
                {/* render screams */}
                {recentScreamsMarkup}
            </Grid>
            <Grid item sm={4} xs={12}>
                Profile..
            </Grid>
        </Grid>
    );
```

## Styling the Scream Component

The Material UI package provides an elegant way of styling components. Its higer-order `withStyles` component allows us to write all styles in an object and use that to access the styles through a prop named `classes`. So first we need to import `withStyles` and create our styles object.

```js
import withStyles from "@material-ui/core/styles/withStyles";

const styles = {
    card: {
        display: "flex",
    },
};
```

Now that we have defined the styles, let's get withStyles to do the magic.

```js
export default withStyles(styles)(Scream);
```

So when exporting the component, we write it this way, passing the `styles` object we created to the higher order function (`withStyles`).

Now, to style a component using the properties defined in `card` found within the `styles` we defined, we just do this:

```jsx
<div className={classes.card}></div>
```

# Authentication

## Logging in

The user credentials are collected from the form and submitted to the Firebase authentication backend. The returned authentication token is stored in `localStorage` to authenticate subsequent requests.

## Authentication State

We need a way to "keep" the user logged in, that is, for as long as the JWT is valid. In `App.js` therefore, in the global scope of the module, we retrieve the token from `localStorage`. Then, using a package called `jwt-decode`, we decode the JWT to view its claims and other important info it contains. The expiry date is of essence at this stage, and it can be found in the decoded JWT as the `exp` property. It is a timestamp (in seconds). To know if the token is expired at the time it is accessed here then we need to compare it with the current datetime's timestamp since epoch. But keep in mind that since we'll use `new Date()` to access the current timestamp, it will be returned in milliseconds and not seconds as in the case of `exp`. So remember to convert `exp` into milliseconds when doing comparison. This is used to determine if the user is authenticated or not. The state of authentication of the user is stored in the `authenticated` variable.


```js
let authenticated;
// get auth token from local storage
const token = localStorage.FBIdToken;
// check if token is authenticated
if (token) {
    const decodedToken = jwtDecode(token);

    if (Date.now() > decodedToken.exp * 1000) authenticated = false;
    else authenticated = true;
}
```
