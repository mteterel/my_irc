import React, {Component} from 'react';
import {Badge, Layout, Tabs} from "antd";
import ChatView from "./components/ChatView";
import LoginModal from "./components/LoginModal";
import io from 'socket.io-client';
import 'antd/dist/antd.css';
import './App.css';

class App extends Component {
    static defaultJoinMessages = [
        "To enter a channel, type /join [channel name]. You can obtain the channel list by typing /list",
        "To get a list of available commands, type /help"
    ];

    static defaultSystemChannel = {
        name: "System",
        messages: [{
            type: "system",
            content: "Welcome to my_irc !"
        }],
        users: [],
        unreadMessages: 0,
    };

    constructor(props) {
        super(props);
        this.state = {isLoggedIn: false, channels: [], userNickname: '', activeChannel: null};
        this.socket = io.connect("ws://localhost:6112");
        this.bindMessageEvents(this.socket);
        this.onSubmitLogin = this.onSubmitLogin.bind(this);
        this.onSubmitMessage = this.onSubmitMessage.bind(this);
        this.onChannelTabChange = this.onChannelTabChange.bind(this);
    }

    componentDidMount() {
        this.setState({
            channels: [App.defaultSystemChannel],
            userNickname: null,
            activeChannel: App.defaultSystemChannel
        });
    }

    bindMessageEvents(socket) {
        socket.on('NICK_CHANGE_ACK', (nickname, success) => {
            if (success) {
                this.setState({userNickname: nickname}, () => {
                    this.state.channels.forEach((v) => {
                        v.messages.push({
                            type: "system",
                            content: "Your nickname has been set to " + nickname
                        });
                    });
                    this.forceUpdate();
                });
            }
            else {
                this.state.channels.forEach((v) => {
                    v.messages.push({
                        type: "system",
                        content: "This nickname is already in use"
                    });
                });
                this.forceUpdate();
            }
        });

        socket.on('CHANNEL_USER_JOIN_INF', (channelName, userNickname) => {
            const channel = this.state.channels.find(v => v.name === channelName);
            channel.messages.push({type: "system", content: `${userNickname} joined ${channelName}`});
            channel.users.push({role: "user", nickname: userNickname});
            this.forceUpdate();
        });

        socket.on('CHANNEL_USER_LEAVE_INF', (channelName, userNickname, reason) => {
            const channel = this.state.channels.find(v => v.name === channelName);
            channel.messages.push({type: "system", content: `${userNickname} left ${channelName} (${reason})`});
            channel.users = channel.users.filter(v => v.nickname !== userNickname);
            this.forceUpdate();
        });

        socket.on('CHANNEL_JOIN_ACK', (channelName, channelUsers, channelHistory) => {
            this.setState({
                channels: [...this.state.channels, {
                    name: channelName,
                    messages: channelHistory,
                    users: channelUsers,
                    unreadMessages: 0
                }]
            });
        });

        socket.on('CHANNEL_LEAVE_ACK', (channelName) => {
            this.setState({channels: this.state.channels.filter(v => v.name !== channelName)});
        });

        socket.on('SERVER_ERROR_INF', (content) => {
            const channel = this.state.activeChannel;
            channel.messages.push({type: "system_error", content: content});
            this.forceUpdate();
        });

        socket.on('CHANNEL_MESSAGE_INF', (channelName, senderNickname, content) => {
            const channel = this.state.channels.find(v => v.name === channelName);
            if (channel.name !== this.state.activeChannel.name)
                channel.unreadMessages++;
            channel.messages.push({type: "user", from: senderNickname, content: content});
            this.forceUpdate();
        });

        socket.on('NICK_CHANGE_INF', (previousNick, newNick) => {
            if (previousNick !== this.state.userNickname && newNick !== this.state.userNickname)
            {
                this.state.channels.forEach(v => {
                    const otherUser = v.users.find(v => v.nickname === previousNick);
                    if (otherUser)
                        otherUser.nickname = newNick;

                    v.messages.push({
                        type: "system",
                        content: `${previousNick} just changed his nickname to ${newNick}`
                    });
                });
                this.forceUpdate();
            }
        });

        socket.on('CHANNEL_LIST_INF', (count, channels) => {
            this.state.activeChannel.messages.push({
                type: "system",
                content: `There are ${count} channels on this server: ${channels.map(v => `[${v}] `)}`
            });
            this.forceUpdate();
        });

        socket.on('CHANNEL_USER_LIST_INF', (count, users) => {
            this.state.activeChannel.messages.push({
                type: "system",
                content: `There are ${count} users on this channel: ${users.map(v => `[@${v}] `)}`
            });
            this.forceUpdate();
        });

        socket.on("WHISPER_MESSAGE_INF", (sourceNickname, message) => {
            this.state.channels.forEach(c => {
                c.messages.push({
                    type: "whisper",
                    from: sourceNickname,
                    content: message,
                })
            });
            this.forceUpdate();
        });
    }

    onSubmitLogin(nickname, callback) {
        this.socket.emit("NICK_CHANGE_REQ", nickname, (success) => {
            callback(success);

            if (success) {
                this.setState({isLoggedIn: true}, () => {
                    this.initializePostLogin();
                    this.forceUpdate();
                });
            }
        });
    }

    onSubmitMessage(userMessage) {
        if (userMessage.startsWith("/users"))
            userMessage = "/users " + this.state.activeChannel.name;

        let channelName = this.state.activeChannel.name;
        channelName = channelName === "System" ? null : channelName;

        this.socket.emit('CHANNEL_MESSAGE_REQ', channelName, userMessage);
    }

    initializePostLogin() {
        const channel = this.state.channels.find((v) => v.name === "System");
        if (channel) {
            App.defaultJoinMessages.forEach((v) => {
                channel.messages.push({type: "system", content: v});
            });
            channel.users.push({name: this.state.userNickname});
        }
    }

    render() {
        return (
            <Layout style={{ height: "100vh" }}>
                <div className={"App"}>
                    {!this.state.isLoggedIn && <LoginModal onSubmitLogin={this.onSubmitLogin}/>}
                    <Tabs onChange={this.onChannelTabChange}>
                        {this.state.channels.map((v, index) =>
                            <Tabs.TabPane
                                tab={<Badge count={v.unreadMessages} dot><span>{v.name}</span></Badge>}
                                key={v.name}>
                                <ChatView channel={v} onSubmitMessage={this.onSubmitMessage}/>
                            </Tabs.TabPane>
                        )}
                    </Tabs>
                </div>
            </Layout>
        );
    }

    onChannelTabChange(activeChannel) {
        const channel = this.state.channels.find(v => v.name === activeChannel);
        channel.unreadMessages = 0;
        this.setState({ activeChannel: channel });
    }
}

export default App;
