import React from 'react';
import TodoItem from './TodoItem';
import PropTypes from 'prop-types';

class Todos extends React.Component {
    render() {
        return this.props.todos.map((todo) => (
            <TodoItem 
                key={todo.id}
                todo={todo}
                toggleComplete={this.props.toggleComplete}
                delTodo={this.props.delTodo}
            />
        ));
    }
}

// PropTypes help identify the props of a component
Todos.propTypes = {
    todos: PropTypes.array.isRequired,
    toggleComplete: PropTypes.func.isRequired,
    delTodo: PropTypes.func.isRequired,
}

export default Todos;