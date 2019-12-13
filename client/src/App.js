import React from 'react';
import './App.css';
import { IconSettings, TabsPanel, Tabs } from '@salesforce/design-system-react';
import '@salesforce-ux/design-system/assets/styles/salesforce-lightning-design-system.min.css';
import ChatView from './components/ChatView';
import IRC_Client from './net/irc';
import messages from './net/messages';

class App extends React.Component {
    static systemChannel = {
        isSystemChannel: true,
        name: "System",
        messages: [],
        users: [],
        unreadCount: 0,
    };

    constructor(props) {
        super(props);
        this.state = {
            connecting: false,
            channels: [App.systemChannel],
            systemChannel: {},
            selectedTabIndex: 0,
            selectedChannel: App.systemChannel,
        };
        this.client = new IRC_Client();

        this.handleSubmitMessage = this.handleSubmitMessage.bind(this);
    }

    componentDidMount() {
        this.setState({connecting: true});
        this.client.connect(() => {
            this.setState({connecting: false});
            this.bindHandlers(this.client.socket);
        });
        this.client.socket.emit(messages.client.CHANNEL_CREATE_REQ, '#webacademie2021');
        this.client.socket.emit(messages.client.CHANNEL_CREATE_REQ, '#ohepimerde');
    }

    onChannelTabChanged(newIndex, oldIndex) {
        const selectedChannel = this.state.channels[newIndex];

        this.setState({
            selectedTabIndex: newIndex,
            selectedChannel: selectedChannel
        });

        if (selectedChannel.unreadCount > 0) {
            selectedChannel.unreadCount = 0;
            this.forceUpdate();
        }
    }

    bindHandlers(socket) {
        socket.on(messages.SERVER_RESULT_INF, (message) => {
            const c = this.state.channels[this.state.selectedTabIndex];
            c.messages.push({
                type: "SYSTEM",
                systemType: "ERROR",
                content: message
            });
            this.forceUpdate();
        });

        socket.on(messages.SERVER_ERROR_INF, (message) => {
            const c = this.state.channels[this.state.selectedTabIndex];
            c.messages.push({
                type: "SYSTEM",
                systemType: "ERROR",
                content: message
            });
            this.forceUpdate();
        });

        socket.on(messages.server.CHANNEL_ENTER_ACK, (data) => {
            this.state.channels.push({
                name: data.channel,
                messages: data.history.map(msg => {
                    return {
                        type: "USER",
                        from: msg.from,
                        content: msg.content
                    }
                }),
                users: data.users
            });
            this.forceUpdate();
        });

        socket.on(messages.server.CHANNEL_LEAVE_ACK, (channelName) => {
            if (this.state.selectedChannel.name === channelName) {
                this.state.selectedChannel = App.systemChannel;
            }

            this.state.channels = this.state.channels.filter(v => v.name !== channelName);
            this.forceUpdate();
        });

        socket.on(messages.server.CHANNEL_CREATE_ACK, (data) => {
            if (false === data.succeed) {
                const c = this.state.selectedChannel;
                c.messages.push({
                    type: "SYSTEM",
                    systemType: "ERROR",
                    content: "Channel " + data.name + " already exists"
                });
            }
            else if (true === data.succeed) {
                this.state.channels.push({
                    name: data.name,
                    messages: [],
                    users: data.users
                });
            }
            this.forceUpdate();
        });

        socket.on(messages.server.CHANNEL_USER_JOIN_INF, (data) => {
            const c = this.state.channels.find(v => v.name === data.channel);
            c.messages.push({
                type: "SYSTEM",
                systemType: "INFO",
                content: `User '${data.nick}' joined the channel`
            });
            c.users.push(data.nick);
            this.forceUpdate();
        });

        socket.on(messages.server.MESSAGE_INF, (data) => {
            const c = this.state.channels.find(v => v.name === data.channel);
            c.messages.push({
                type: "USER",
                from: data.from,
                content: data.message
            });

            if (this.state.selectedChannel !== c)
                c.unreadCount += 1;

            this.forceUpdate();
        });

        socket.on(messages.server.CHANNEL_USER_LEAVE_INF, (data) => {
            const reason = data.reason === 'leave' ? 'User Leave' : 'IRC Quit';
            const c = this.state.channels.find(v => v.name === data.channel);
            c.messages.push({
                type: "SYSTEM",
                systemType: "INFO",
                content: data.nick + ' left the channel (' + reason + ')'
            });
            c.users = c.users.filter((u) => u !== data.nick);

            if (this.state.selectedChannel !== c)
                c.unreadCount += 1;

            this.forceUpdate();
        });
    }

    handleSubmitMessage(input) {
        this.client.socket.emit(messages.client.MESSAGE_REQ,
            this.state.selectedChannel.name,
            input
        );

        return true;
    }

    render() {
        return (
            <div className={"App"}>
                <IconSettings iconPath="/assets/icons">
                    <Tabs onSelect={this.onChannelTabChanged.bind(this)}>
                        {this.state.channels.map((value, index) => {
                            return (
                                <TabsPanel label={value.name + (value.unreadCount ? ` (${value.unreadCount})` : "")}
                                           key={index}>
                                    <ChatView channel={value} onSubmitMessage={this.handleSubmitMessage}/>
                                </TabsPanel>
                            )
                        })}
                    </Tabs>
                </IconSettings>
            </div>
        );
    }
}

export default App;
