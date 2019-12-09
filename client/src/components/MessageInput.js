import React from 'react';
import { Input } from '@salesforce/design-system-react';

class MessageInput extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Input placeholder={"Type a message then press Enter"}/>
        )
    }
}

export default MessageInput;
