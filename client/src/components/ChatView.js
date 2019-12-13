import React from 'react';
import UserList from "./UserList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

class ChatView extends React.Component
{
    static defaultProps = {
        channel: null,
        showUserList: true,
        onSubmitMessage: null
    };

    render() {
        return (
            <div className="slds-grid slds-gutters">
                <div className="slds-col slds-size_10-of-12 slds-border_top slds-border_bottom slds-border_left slds-border_right messages">
                    <MessageList messages={this.props.channel.messages}/>
                    <MessageInput onSubmit={this.props.onSubmitMessage}/>
                </div>
                {this.props.showUserList && !this.props.channel.isSystemChannel &&
                    <div
                        className="slds-col slds-size_2-of-12 slds-border_top slds-border_bottom slds-border_left slds-border_right userList">
                        <UserList users={this.props.channel.users}/>
                    </div>
                }
            </div>
        );
    }
}

export default ChatView;
