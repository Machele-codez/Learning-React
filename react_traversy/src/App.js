import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import './App.css';

import Todos from './components/Todos';
import Header from './components/layout/Header';
import AddTodo from './components/AddTodo';

import { v4 as uuidV4 } from 'uuid';
import About from './components/pages/About';

import axios from 'axios';

class App extends React.Component {
  state = {
    todos: []
  }


  componentDidMount() {
    axios.get('https://jsonplaceholder.typicode.com/todos/?_limit=10')
      .then(response => this.setState({ todos: [...response.data] }))
  }


  // Toggle Complete
  toggleComplete = (id) => {
    this.setState({
      todos: this.state.todos.map(todo => {
        if (id === todo.id) {
          todo.completed = !todo.completed
        }

        return todo;
      })
    })
  }


  // delete a todo item
  delTodo = (id) => {
    axios.delete(`https://jsonplaceholder.typicode.com/todos/${id}`)
    .then(response => this.setState({todos: this.state.todos.filter(todo => id !== todo.id)}))
  }


  // add todo item
  addTodoItem = title => {
    axios.post('https://jsonplaceholder.typicode.com/todos', {
      title: title,
      completed: false
    })
      .then(response => this.setState({todos: [...this.state.todos, response.data]}))
  }

  render() {
    return (
      <Router>
        <div className="App">
          <div className="container">
            <Header />

            {/* HOME ROUTE */}
            <Route exact path="/" render={props => (
              <React.Fragment>
                <AddTodo addTodoItem={this.addTodoItem} />
                <Todos 
                  todos={this.state.todos}
                  delTodo={this.delTodo}
                  toggleComplete={this.toggleComplete}
                />
              </React.Fragment>
            )} />

            {/* ABOUT ROUTE */}
            <Route path="/about" component={About} />
          </div>
        </div>
      </Router>
    );
  }

}

export default App;
