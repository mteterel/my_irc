import React from 'react';
import { Style } from 'react';

class MessageList extends React.Component
{
    static defaultProps = {
        messages: []
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <h1>Messages</h1>
                <ul>
                    {this.props.messages.map((value, index) => {
                        let content = value.content;
                        if (value.type === "SYSTEM")
                            content = "(SYSTEM] " + content;
                        return <li style={value.type === "SYSTEM" ? styles.systemMessage : null} key={index}>{content}</li>;
                    })}
                </ul>
            </div>
        );
    }
}

const styles = {
    systemMessage: {
        color: "red",
        fontWeight: "bold"
    },
};

export default MessageList;
