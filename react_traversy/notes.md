# REACT with Traversy Media

<b>React</b> is a javascript library which is actually seen as a framework by a lot of devs due to the way it is used to handle multiple tasks relevant to the whole dev process. 
A react app is created on-the-go with some boilerplate code using `npx create-react-app *directory_name*`
The main page of the whole website is the index.html by default. There is a div there that has an id of root. This element shall hold all the content of the website. The content is created in react and rendered in the HTML within the index.js file using ReactDOM.render().

## Components
In React, everything on the webpage is represented by a component. So each todo element is a component, just as the container element for all the todos is also a component, just as everything on the page is in a containing component.

So first of all, to display something on the webpage, find the index.js file. It controls what is inserted into the index.html file which is rendered as our SPA. The index.html file contains a div with id="root". It is in this div that the components to be rendered are inserted.

A component can be created using a class or function definition. For both cases you need to import React and Component from the react module. <br>`import React, {Component} from 'react'`<br>
Then, the class way:
``` js
/* 
Could've been
class App extends React.Component{}
*/ 
class App extends Component {
    render() {
        return(
            // HTML (actually, jsx) to be rendered in browser
        );
    }
        
}
```
The return block contains JSX, which is similar to Jinja (Jinja template engine) for Flask. JSX allows JavaScript code to be written with HTML easily using `{}` to represent the JSX. 

Class components have methods called `lifecylce methods`. These are called at different stages from the point the component is being loaded to rendering. Among them are `render` and `componentDidMount` which we would see later.

## States
*React states* are used to define qualities or properties that can be modified dynamically and used by components to make the application more interactive. 

To define states in '*classy*' components, we just define variable in the component definition. After defining a state, it can be passed <span style="background-color: rgba(255,255,255,0.2); padding: 1px 2px; border-radius: 10%">down</span> to other components by passing them as `props`.

``` js
class Comp extends React.Component{

    state = {
        text: "hello"
    }

    render() {
        return(
            <div>
                <ImportedComponent propName={this.state.text}/>
            </div>
        );
    }
}
```

To access the passed on state within the receiving component, it is referenced within the component as `this.props.propName`.

For the todo app we create the main App component.
Then we create a Todos component which should contain all the todos.
Then the TodoItem component represents each todo. 
A state is defined within the App component to contain the list(Array) of todo items. The state is placed there so that it can be accessed by the Todos and TodoItem components as well. So the App component contains the Todos component which contains the TodoItem component. The todos are passed down from the state of the App component to the Todos component as a prop named `todos`. Then to pass individual todo items from the Todos component to the TodoItem component, we need to loop through the Array of todos. Then we pass each individual todo as a prop, including its key(recommended). 

``` js 
class Todos extends React.Component {
    render() {
        const todos = this.props.todos;
        let arr = [];
        todos.forEach(todo => {
            arr.push(<TodoItem key={todo.id} todo={todo} toggleComplete={this.props.toggleComplete}/>);
        });
        
        return arr
    }
}
```

A much simpler way of doing the same thing is to call the `map` function off the array of todos. `map` is part of some funcitons known as higher-order functions in JS. `Array.map` just takes an array, modifies each element using the callback function passed as an argument, then returns the modified array.

``` js 
class Todos extends React.Component {
    render() {
        return this.props.todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} toggleComplete={this.props.toggleComplete} />
        ));
    }
}
```

## Proptypes
PropTypes help identify the props of a component. To define the prototype of a component, we first need to: 
`import PropTypes from 'prop-types';`

Then the actual definition is done outside the component's own definition:

```js
/* SYNTAX
componentName.propTypes = {
    propName: PropTypes.propDataType.isRequired
}
*/

// EXAMPLE
Todos.propTypes = {
    todo: PropTypes.Array.isRequired
}

```

## Styling with CSS in React
To style within a component's definition you can simply add the style attribute to the HTML element that should be styled, within the render's return method. The value of the style attribute should be enclosed within double curly braces. 
```js
<div style={{ property1Name: value, property2Name: value }}>
</div>
```
Remember its JSX.
We can also pass a variable or a function(a method of the component's class) which returns the styles as an Object instead. And in that case, only one set of curly braces is needed since an Object is returned by the function (the Object has its own set of curly braces).
```js
// Method Within Component Class Definition
myComponentStyles = () => {
    return {
        propertyOne: 'value',
        propertyTwo: 'value',
        propertyThree: 'value',
    }
}

// return value of component's render method
render () {
    return(
        <div style={ this.myComponentStyles() }>
        </div>
    )
}

```
## Toggling Todo Complete
Now, we need to update the state of our todos upon clicking on the checkboxes to toggle them as completed or not. So we add an eventlistener to the checkbox, within the TodoItem component, which calls a function, passed as a prop from our App component where the state is defined. To target the actual todo item which needs its state modified, the toggleComplete funciton has a parameter which represent's the todo item's id.

```js
// Doing this will call the toggleComplete function for all todo items immediately the page loads
<input type="checkbox" onChange={this.props.toggleComplete(this.props.todo.id)} />

// to fix the problem above, we need to use `bind`
<input type="checkbox" onChange={this.props.toggleComplete.bind(this, this.props.todo.id)} />
```

### What does bind do?
It allows a single function to be defined somewhere, then have its `this` keyword represent the first argument passed in as the first argument to `bind`. So it kind of creates another function out of an already defined function. This new function possesses the same parameters. The difference is that the new function is bound to the object which is passed in as the first argument to `bind`.

```js



```

So to actually change the state, within the toggleComplete method, we use `setState` which is a built in method of components. `setState` modifies the state of the component. state is an object. if the state passed to setState contains an existing state variable, then its value is overridden. But if the state variable passed as an argument to setState is non-existent, then it is added as another state variable to the existing state of the component.
```js
// supposing this is a component's state
state = {
    age: 2
}

// modifying existing state variable
modifyExistingStateVar = () => {
    this.setState({age: 3})
    console.log(this.state)
}

// adding a new state variable
addNewStateVar = () => {
    this.setState({height: 31})
    console.log(this.state)
}


modifyExistingStateVar()  // Output: {age: 3}
addNewStateVar() // Output: {age: 2, height: 31}
```

So our toggleComplete function is:
```js
toggleComplete = (id) => {
    this.setState({
        todos: this.state.todos.map(todo => {
            if (id === todo.id) {
                todo.completed = !todo.completed
            }
            
            return todo
        })
    })
}
```
The setState function is called within toggleComplete to modify an existing state variable - `todos`. What do we do to it? We call `map` off the current todos (`this.state.todos`) to check for the task that matches the `id` argument. If the todo matches, then we toggle its completed value which is a boolean.

Remember that a value needs to be returned within the map function's callback.
Remember that the map function returns an Array of all the values that are returned within its callback.

## Adding header, todos using a form
### Header
so to add the header which wouldn't have any need for state and any functionality, we just use a function-based component to do that. For funtion based components, they just return the required HTML/JSX to be rendered.

```js
function Header() {
    return (
        <header style={headerStyle}>
            <h1>TodoList</h1>
        </header>
    )
}

export default Header;
```

### Adding Todos using a form element
so as usual, a component is created for the form. 

#### form fields and state variables
Usually, when there are input fields in a component, they should have state variables to hold their values. Then the value in the state variable should be passed as the value of each input field. But if this alone is done, then the input field would be made readonly. This is because as you type in the input field, an onChange event is fired but not handled to update the state variable, so React will just make the field a readonly field. If the field is supposed to be mutable, then the onChange event must be handled.
```js
onChangeHandler = (e) => {
    this.setState({
        title: e.target.value
    })
}
```
But if there is multiple form fields, it would be very tedious to write an event handler for each field. So instead, one event hadler can be used, then we reference the state variable using the name attribute of the form field.
```js
onChangeHandler = (e) => {
    this.setState({
        [e.target.name]: e.target.value
    })
}
```

#### submitting form data - Adding a new todo item
To submit the data, we have to add a submit event handler to the form. The `onSubmit` is going to call another function which is responsible for changing the state in which all the todos are found. Then we reset the form by changing the state to its initial default values.

```js
onSubmitHandler = e => {
    // prevent default event trigger action
    e.preventDefault();
    // call function responsible for modifying global state which contains the todos
    this.props.AddTodoItem(this.state.title);
    // clear form
    this.setState({ title: '' })
}
```

## Routers
NB:
React fragments are used when no actula HTML tag is intended to contain the remaining elements, but JSX is still used within rendering.

Supposing there is an about page which we want to visit when we enter a specific URL. Then we need react to render that page when that URL is entered. This is one reason for routers.

So first of all, all the components including the main App component needs to be enclosed within `BrowserRouter` tags. `BrowserRouter` is within the `react-router-dom` module.

```js
import {BrowserRouter as Router} from 'react-router-dom';

render() {
    return (
        <Router>
            <div className="App">
                <div className="container">
                    <ComponentName />
                </div>  
            </div>
        </Router>
    );
}
```

To render different components depending on the URL path, we need to import `Route` also from `react-router-dom`.
Within `Route`, a path is defined to represent the URL path. Then, the components to be rendered when that path is visited are returned in by the `props` callback of the `Route` `render` prop. If multiple components are to be returned, remember to wrap them in a single element. If the multiple components should be rendered excluding the container element then just use `React.Fragment` to wrap them. `React.Fragment` is not actually rendered in the DOM, it is just used for some JSX purposes.

So our home route looks like:
```jsx
<Router>
    <div className="App">
        <div className="container">
        <Header />
        
        {/* HOME ROUTE */}
        <Route exact path="/" render={props => (
            <React.Fragment>
                <AddTodo addTodoItem={this.addTodoItem} />
                <Todos todos={this.state.todos} delTodo={this.delTodo} toggleComplete={this.toggleComplete} />
            </React.Fragment>
        )} />

        {/* ABOUT ROUTE */}

        </div>
    </div>
</Router>
```

Notice the `exact` prop added to the `Route`. It ensures that the path is matched exactly as provided before the components are rendered.

To add the about page route which is a single component, we just add another `Route` and this time define a `component` prop.

```jsx
{/* ABOUT ROUTE */}
<Route path="/about" component={About} />  
```

**NB**<br>
`component` is used to render a single component in a `Route` whereas `render` is used to render multiple components in a `Route`.

### Adding Links
In React, instead of creating a link using the anchor `<a>` tag, we use `Link`. The attribute that defines the path that the link leads to is called `to`. `Link` is also imported from `react-router-dom`

```jsx
<Link to="/path/to/destination"></Link>
```

## HTTP requests
We'll be using axios, just a preference. So we'll fetch data from a resource and then use it to populate the state instead. This is done within a lifecyle method called `componentDidMount`. The `componentDidMount` is 
>called immediately after a component is mounted. Setting state here will trigger re-rendering.

```jsx
componentDidMount() {
    axios.get('https://jsonplaceholder.typicode.com/todos/?_limit=10')
      .then(response => this.setState({todos: response.data}))
}
```