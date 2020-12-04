import React, { Component } from 'react';
import PropTypes from 'prop-types';

export class TodoItem extends Component {

    getStyle = () => {
        return {
            textDecoration: this.props.todo.completed ? 'line-through' : 'none',
            backgroundColor: '#c3c0c042',
            borderBottom: '1px dotted black',
            padding: '10px'   
        }
    }

    render() {
        const {id, title} = this.props.todo;

        return (
            <div style={this.getStyle()}>
                <p>
                    <input type="checkbox" onChange={this.props.toggleComplete.bind(this, id)} />
                    { '  ' }
                    { title }
                    <button style={closeBtnStyle} onClick={this.props.delTodo.bind(this, id)}>x</button>
                </p>
            </div>
        )
    }
}


TodoItem.propTypes = {
    todo: PropTypes.object.isRequired,
    toggleComplete: PropTypes.func.isRequired,
    delTodo: PropTypes.func.isRequired,
}

const closeBtnStyle = {
    background: '#CE1126',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    padding: '5px 7px',
    cursor: 'pointer',
    float: 'right',
}

export default TodoItem;
