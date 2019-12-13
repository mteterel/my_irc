import React from 'react';
import { Input } from '@salesforce/design-system-react';

class MessageInput extends React.Component {
    static defaultProps = {
        onSubmit: null
    };

    constructor(props) {
        super(props);
        this.state = {
            userInput: ''
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    handleInputChange(e) {
        this.setState({userInput: e.target.value});
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && this.props.onSubmit && this.props.onSubmit(this.state.userInput)) {
            this.setState({userInput: ''});
        }
    }

    render() {
        return (
            <Input placeholder={"Type a message then press Enter"} value={this.state.userInput} onChange={this.handleInputChange} onKeyDown={this.handleKeyDown}/>
        )
    }
}

export default MessageInput;
