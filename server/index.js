import io from 'socket.io';
import ioc from 'socket.io-client';
import messages from './messages';
import { IRC_Channel } from './types';

const channels = new Map();
const users = new Map();

const server = io.listen(6112);
let mmm = 0;
server.on('connection', (socket) => {
    console.log('(Server): Client connected successfully');
    mmm += 1;
    const user = {
        socket,
        socketId: socket.id,
        nick: 'NO_NICKNAME_' + mmm,
        authenticated: false,
        channels: [],
    };

    const handleNickChangeRequest = (nick) => {
        if (users.has(nick) === true) {
            socket.emit(messages.SERVER_ERROR_INF, 'NICK_CHANGE_REQ: Nickname already exists');
            return false;
        }

        const oldNick = user.nick;
        user.nick = nick;

        if (user.authenticated === false) {
            user.authenticated = true;
            users.set(user.nick, user);
        } else {
            users.delete(oldNick);
            users.set(user.nick, user);

            user.channels.forEach((c) => {
                c.broadcast(messages.client.NICK_CHANGE_INF, {
                    from: oldNick,
                    nick: user.nick,
                })
            });

            return true;
        }
    };

    const handleChannelListRequest = (query) => {
        const result = Array.from(channels, ([key, value]) => value.name)
            .filter((v) => (query ? v.includes(query) : true));

        socket.emit(messages.server.CHANNEL_LIST_ACK, {
            count: result.length,
            channels: result,
        });
    };

    const handleChannelEnterRequest = (name) => {
        console.log(name);

        if (channels.has(name) === false) {
            socket.emit(messages.SERVER_RESULT_INF, 'Channel ' + name + ' not found');
            return false;
        }

        const channel = channels.get(name);
        channel.users.forEach((u) => {
            u.socket.emit(messages.server.CHANNEL_USER_JOIN_INF, {
                channel: channel.name,
                nick: user.nick,
            });
        });

        channel.users.push(user);
        user.channels.push(channel);
        socket.emit(messages.server.CHANNEL_ENTER_ACK, {
            channel: channel.name,
            users: channel.users.map(u => u.nick),
            history: channel.messages
        });
        return true;
    };

    const handleChannelLeaveRequest = (name) => {
        if (channels.has(name) === false) {
            socket.emit(messages.SERVER_ERROR_INF, 'Channel ' + name + ' not found');
            return false;
        }

        const channel = channels.get(name);

        if (undefined === channel.users.find((u) => u.nick === user.nick)) {
            socket.emit(messages.SERVER_ERROR_INF, 'You are not present in the channel ' + name);
            return false;
        }

        socket.emit(messages.server.CHANNEL_LEAVE_ACK, channel.name);

        user.channels.filter((c) => c.name !== channel.name);
        channel.users = channel.users.filter((u) => u.nick !== user.nick);
        channel.broadcast(messages.server.CHANNEL_USER_LEAVE_INF, {
            channel: channel.name,
            nick: user.nick,
            reason: 'leave',
        });

        return true;
    };

    const handleChannelCreateRequest = (name) => {
        if (name.startsWith('#') === false) {
            name = `#${name}`;
        }

        if (channels.has(name) === true) {
            socket.emit(messages.server.CHANNEL_CREATE_ACK, {
                succeed: false, name
            });

            // DEVELOPMENT === enter channel anyways
            handleChannelEnterRequest(name);
            return false;
        }

        const channel = new IRC_Channel(name);
        channel.users.push(user);
        channels.set(name, channel);

        socket.emit(messages.server.CHANNEL_CREATE_ACK, {
            succeed: true,
            name,
            users: channel.users.map(u => u.nick),
        });

        return true;
    };

    const handleChannelDestroyRequest = (name) => {
        if (channels.has(name) === false) {
            socket.emit(messages.SERVER_ERROR_INF, 'DELETE_CHANNEL: no channel found');
            return false;
        }

        const channel = channels.get(name);
        channel.broadcast(messages.server.CHANNEL_LEAVE_ACK, {
            channel: channel.name,
        });

        channel.delete(name);
        return true;
    };

    const handleChannelUserListRequest = (name) => {
        if (channels.has(name) === false) {
            socket.emit(messages.SERVER_ERROR_INF, 'Channel ' + name + ' not found');
            return false;
        }

        const channel = channels.get(name);

        if (undefined === channel.users.find((v) => v.nick === user.nick)) {
            socket.emit(messages.SERVER_ERROR_INF, 'You are not present in the channel ' + name);
            return false;
        }

        socket.emit(messages.server.CHANNEL_USER_LIST_ACK, {
            channel: channel.name,
            count: channel.users.length,
            users: Array.from(channel.users, (value) => value.nick),
        });

        return true;
    };

    const handleWhisperRequest = (destination, message) => {
        if (users.has(destination) === false) {
            socket.emit(messages.SERVER_ERROR_INF, 'User ' + destination + ' can not be found');
            return false;
        }

        const otherUser = users.get(destination);
        otherUser.socket.emit(messages.server.WHISPER_INF, {
            from: user.name,
            message,
        });

        return true;
    };

    const handleMessageRequest = (channelName, message) => {
        if (channels.has(channelName) === false) {
            socket.emit(messages.SERVER_ERROR_INF, 'Channel ' + channelName + ' not found');
            return false;
        }

        if (message === "/leave") {
            handleChannelLeaveRequest(channelName);
            return true;
        }

        const channel = channels.get(channelName);

        if (undefined === channel.users.find((value) => value.nick === user.nick)) {
            socket.emit(messages.SERVER_ERROR_INF, 'You are not present in the channel ' + channelName);
            return false;
        }

        if (channel.messages.length >= 100) {
            channel.messages.shift();
        }

        channel.messages.push({ from: user.nick, content: message });

        channel.broadcast(messages.server.MESSAGE_INF, {
            channel: channel.name,
            from: user.nick,
            message,
        });

        return true;
    };

    socket.on(messages.client.NICK_CHANGE_REQ, (nick) => handleNickChangeRequest(nick));
    socket.on(messages.client.CHANNEL_LIST_REQ, (query) => handleChannelListRequest(query));
    socket.on(messages.client.CHANNEL_CREATE_REQ, (name) => handleChannelCreateRequest(name));
    socket.on(messages.client.CHANNEL_DESTROY_REQ, (name) => handleChannelDestroyRequest(name));
    socket.on(messages.client.CHANNEL_ENTER_REQ, name => handleChannelEnterRequest(name));
    socket.on(messages.client.CHANNEL_LEAVE_REQ, name => handleChannelLeaveRequest(name));
    socket.on(messages.client.CHANNEL_USER_LIST_REQ, (name) => handleChannelUserListRequest(name));
    socket.on(messages.client.WHISPER_REQ, (destination, message) => handleWhisperRequest(destination, message));
    socket.on(messages.client.MESSAGE_REQ, (channelName, message) => handleMessageRequest(channelName, message));

    socket.once('disconnect', () => {
        user.channels.forEach((c) => {
            c.users = c.users.filter((u) => u.socketId !== user.socketId);
            c.users.forEach((u) => {
                u.socket.emit(messages.server.CHANNEL_USER_LEAVE_INF, {
                    channel: c.name,
                    nick: user.nick,
                    reason: 'disconnect',
                });
            });
        });
        users.delete(user.nick);
    });
});


// =====================================
// TEST CLIENT IMPLEMENTATION
// =====================================
/*
const client = ioc('ws://localhost:6112');
client.on('connect', async () => {
    console.log('(Client): me the client connected !');

    client.on(messages.SERVER_RESULT_INF, (message) => {
        console.log('(Client): [ SERVER_RESULT_INF ]', message);
    });

    client.on(messages.server.CHANNEL_LIST_ACK, (result) => {
        console.log('(Client): [ CHANNEL_LIST_ACK ]', result);
    });

    client.on(messages.server.CHANNEL_USER_LIST_ACK, (result) => {
        console.log('(Client): [ CHANNEL_USER_LIST_ACK ]', result);
    });

    client.on(messages.server.MESSAGE_INF, (result) => {
        const { channel, from, message } = result;
        console.log('(Client):', from, 'sent the message:', message, 'on channel', channel);
    });

    client.emit(messages.client.NICK_CHANGE_REQ, 'TestNick#1');
    client.emit(messages.client.NICK_CHANGE_REQ, 'TestNick#2');
    client.emit(messages.client.CHANNEL_ENTER_REQ, '#404_not_found');
    client.emit(messages.client.CHANNEL_CREATE_REQ, '#200_ok');
    client.emit(messages.client.CHANNEL_LIST_REQ);
    client.emit(messages.client.CHANNEL_LIST_REQ, 'kkk');
    client.emit(messages.client.CHANNEL_LIST_REQ, 'ok');
    client.emit(messages.client.CHANNEL_USER_LIST_REQ, '#404_not_found');
    client.emit(messages.client.CHANNEL_USER_LIST_REQ, '#200_ok');

    client.emit(messages.client.MESSAGE_REQ, '#200_ok', 'BONJOUR LE MONDE !');

    // client.disconnect();
});
 */
