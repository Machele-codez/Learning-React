import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class AddTodo extends Component {
    
    state = {
        title: ''
    }
    
    onChangeHandler = e => {
        this.setState({
            [e.target.name]: e.target.value
        })
    }

    onSubmitHandler = e => {
        // prevent default event trigger action
        e.preventDefault();
        // call function responsible for modifying global state which contains the todos
        this.props.addTodoItem(this.state.title);
        // clear form
        this.setState({ title: '' })
    }

    render() {
        return (
            <form onSubmit={this.onSubmitHandler} style={{display: 'flex'}}>
                <input 
                    type="text"
                    name="title"
                    placeholder="Add Todo..."
                    style={inputStyle}
                    value={this.state.title}
                    onChange={this.onChangeHandler}
                />
                <input 
                    className="btn"
                    type="submit"
                    value="Submit"
                    style={{flex: '2'}}
                />
            </form>
        )
    }
}

AddTodo.propTypes = {
    addTodo: PropTypes.func.isRequired
}

const inputStyle = {
    flex: '8',
    padding: '5px'
}