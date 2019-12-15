import React, {Component} from 'react';
import {Input} from "antd";

class MessageInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            userInput: ''
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    handleChange(e) {
        this.setState({userInput: e.target.value});
    }

    handleKeyDown(e) {
        if (e.key === "Enter") {
            this.props.onSubmitMessage(e.target.value);
            this.setState({userInput: ''});
        }
    }

    render() {
        return (
            <div>
                <Input placeholder={"Type text and press ENTER"}
                       value={this.state.userInput}
                       onChange={this.handleChange}
                       onKeyDown={this.handleKeyDown}
                       autoFocus={true}/>
            </div>
        );
    }
}

export default MessageInput;
