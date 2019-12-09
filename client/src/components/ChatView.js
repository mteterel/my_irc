import React from 'react';
import UserList from "./UserList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

class ChatView extends React.Component
{
    static defaultProps = {
        channel: null,
        showUserList: true,
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="slds-grid slds-gutters ">
                <div className="slds-col slds-size_9-of-12 slds-border_top slds-border_bottom slds-border_left slds-border_right messages">
                    <MessageList messages={this.props.channel.messages}/>
                    <MessageInput/>
                </div>
                {this.props.showUserList &&
                    <div
                        className="slds-col slds-size_3-of-12 slds-border_top slds-border_bottom slds-border_left slds-border_right userList">
                        <UserList users={this.props.channel.users}/>
                    </div>
                }
            </div>
        );
    }
}

export default ChatView;
