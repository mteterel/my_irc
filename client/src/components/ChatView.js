import React, {Component} from 'react';
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import UserList from "./UserList";

class ChatView extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <MessageList messages={this.props.channel.messages}/>
                <MessageInput onSubmitMessage={this.props.onSubmitMessage}/>
                {this.props.channel.name !== "System" && <UserList users={this.props.channel.users}/>}
            </div>
        );
    }
}

export default ChatView;
