import React from 'react';
import './App.css';
import { IconSettings, TabsPanel, Tabs, Input } from '@salesforce/design-system-react';
import '@salesforce-ux/design-system/assets/styles/salesforce-lightning-design-system.min.css';
import ChatView from './components/ChatView';
import IRC_Client from './net/irc';
import messages from './net/messages';

class App extends React.Component {
    static systemChannel = {
        name: "System",
        messages: [],
        users: ["Art#123", "Galy#444"]
    };

    constructor(props) {
        super(props);
        this.state = {
            connecting: false,
            channels: [App.systemChannel],
            systemChannel: {},
            selectedTabIndex: 0
        };
        this.client = new IRC_Client();
    }

    componentDidMount() {
        this.setState({connecting: true});
        this.client.connect(() => {
            this.setState({connecting: false});
            this.bindHandlers(this.client.socket);
            this.client.socket.emit(messages.client.CHANNEL_CREATE_REQ, '#webacademie2021');
        });
    }

    onChannelTabChanged(newIndex, oldIndex) {
        this.setState({ selectedTabIndex: newIndex });
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

        socket.on(messages.server.CHANNEL_ENTER_ACK, (data) => {
            this.state.channels.push({
                name: data.name,
                messages: [],
                users: []
            });
            this.forceUpdate();
        });

        socket.on(messages.server.CHANNEL_CREATE_ACK, (data) => {
            this.state.channels.push({
                name: data.name,
                messages: [],
                users: []
            });
            this.forceUpdate();
        });

        socket.on(messages.server.CHANNEL_USER_JOIN_INF, (data) => {
            const c = this.state.channels.find(v => v.name === data.channel);
            c.messages.push({
                type: "SYSTEM",
                systemType: "INFO",
                content: "User joined the channel: " + data.nick
            });
        });

        socket.on(messages.server.CHANNEL_USER_LEAVE_INF, (data) => {
            const c = this.state.channels.find(v => v.name === data.channel);
            c.messages.push({
                type: "SYSTEM",
                systemType: "INFO",
                content: "User left the channel: " + data.nick
            });
        });

        socket.on(messages.server.MESSAGE_INF, (data) => {
            const c = this.state.channels.find(v => v.name === data.channel);
            c.messages.push({
                type: "USER",
                from: data.from,
                content: data.message
            });
        });
    }

    render() {
        return (
            <div className={"App"}>
                <IconSettings iconPath="/assets/icons">
                    <Tabs onSelect={this.onChannelTabChanged.bind(this)}>
                        {this.state.channels.map((value, index) => {
                            return (
                                <TabsPanel label={value.name} key={index}>
                                    <ChatView channel={value}/>
                                </TabsPanel>)
                        })}
                    </Tabs>
                </IconSettings>
            </div>
        );
    }
}

export default App;
