import io from 'socket.io';
import ioc from 'socket.io-client';
import messages from './messages';

const channels = new Map();
const users = new Map();

const server = io.listen(3000);
server.on('connection', (socket) => {
    console.log('(Server): Client connected successfully.');

    const user = {
        socket,
        socketId: socket.id,
        nick: null,
        authenticated: false,
        channels: [],
    };

    socket.on(messages.client.NICK_CHANGE_REQ, (nick) => {
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

            user.channels.forEach((c) => c.users.forEach((u) => {
                u.socket.emit(messages.client.NICK_CHANGE_INF, {
                    from: oldNick,
                    nick: user.nick,
                });
            }));
        }

        return true;
    });

    socket.on(messages.client.CHANNEL_LIST_REQ, (query) => {
        const result = Array.from(channels, ([key, value]) => value.name)
            .filter((v) => (query ? v.includes(query) : true));

        socket.emit(messages.server.CHANNEL_LIST_ACK, {
            count: result.length,
            channels: result,
        });
    });

    socket.on(messages.client.CHANNEL_CREATE_REQ, (name) => {
        if (channels.has(name) === true) {
            socket.emit(messages.CHANNEL_CREATE_ACK, { succeed: false, name });
            return false;
        }

        const channel = { name, users: [user] };
        channels.set(name, channel);

        socket.emit(messages.CHANNEL_CREATE_ACK, {
            succeed: true,
            name,
            users: channel.users.map((u) => u.name),
        });

        return true;
    });

    socket.on(messages.client.CHANNEL_DESTROY_REQ, (name) => {
        if (channels.has(name) === false) {
            socket.emit(messages.SERVER_ERROR_INF, 'DELETE_CHANNEL: no channel found');
            return false;
        }

        const channel = channels.get(name);
        channel.users.forEach((u) => {
            u.socket.emit(messages.server.CHANNEL_LEAVE_ACK, {
                channel: channel.name,
            });
        });

        return true;
    });

    socket.on(messages.client.CHANNEL_ENTER_REQ, (name) => {
        if (channels.has(name) === false) {
            socket.emit(messages.SERVER_RESULT_INF, 'CHANNEL_ENTER_REQ: Channel not found.');
            return false;
        }

        const channel = channels.get(name);
        channel.users.forEach((u) => {
            u.emit(messages.server.CHANNEL_USER_JOIN_INF, {
                channel: channel.name,
                user,
            });
        });

        // TODO: send last 50 messages
        channel.users.push(user);
        socket.emit(messages.server.CHANNEL_ENTER_ACK, { channel: channel.name, history: null });
        return true;
    });

    socket.on(messages.client.CHANNEL_LEAVE_REQ, (name) => {
        if (channels.has(name) === false) {
            socket.emit(messages.SERVER_ERROR_INF, 'CHANNEL_LEAVE_REQ: Channel not found');
            return false;
        }

        const channel = channels.get(name);

        if (undefined === channel.users.find((u) => u.nick === user.nick)) {
            socket.emit(messages.SERVER_ERROR_INF, 'CHANNEL_LEAVE_REQ: You are not in the channel');
            return false;
        }

        channel.users = channel.users.filter((u) => u.nick !== user.nick);
        channel.users.forEach((u) => u.socket.emit(messages.server.CHANNEL_USER_LEAVE_INF, {
            user: user.nick,
        }));

        return true;
    });

    socket.on(messages.client.CHANNEL_USER_LIST_REQ, (name) => {
        if (channels.has(name) === false) {
            socket.emit(messages.SERVER_ERROR_INF, 'CHANNEL_USER_LIST_REQ: no channel found');
            return false;
        }

        const channel = channels.get(name);

        if (undefined === channel.users.find((v) => v.nick === user.nick)) {
            socket.emit(messages.SERVER_ERROR_INF, 'CHANNEL_USER_LIST_REQ: You are not in the channel');
            return false;
        }

        socket.emit(messages.server.CHANNEL_USER_LIST_ACK, {
            channel: channel.name,
            count: channel.users.length,
            users: Array.from(channel.users, (value) => value.nick),
        });

        return true;
    });

    socket.on(messages.client.WHISPER_REQ, (destination, message) => {
        if (users.has(destination) === false) {
            socket.emit(messages.SERVER_ERROR_INF, 'WHISPER_REQ: no user found');
            return false;
        }

        const dest = users.get(destination);
        dest.socket.emit(messages.server.WHISPER_INF, {
            from: user.name,
            message,
        });

        return true;
    });

    socket.on(messages.client.MESSAGE_REQ, (channelName, message) => {
        if (channels.has(channelName) === false) {
            socket.emit(messages.SERVER_ERROR_INF, 'MESSAGE_REQ: Channel not found');
            return false;
        }

        const channel = channels.get(channelName);

        if (undefined === channel.users.find((value) => value.nick === user.nick)) {
            socket.emit(messages.SERVER_ERROR_INF, 'MESSAGE_REQ: You are not in the channel');
            return false;
        }

        channel.users.forEach((u) => {
            u.socket.emit(messages.server.MESSAGE_INF, {
                channel: channel.name,
                from: user.nick,
                message,
            });
        });

        return true;
    });

    socket.on('disconnect', () => {
        console.log('(Server): User disconnected !!!');
        // TODO: notify users of all channels
    });
});

// =====================================
// TEST CLIENT IMPLEMENTATION
// =====================================
const client = ioc('ws://localhost:3000');
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
    client.emit(messages.client.CHANNEL_USER_LIST_REQ, '#404_not_found');
    client.emit(messages.client.CHANNEL_USER_LIST_REQ, '#200_ok');

    client.emit(messages.client.MESSAGE_REQ, '#200_ok', 'BONJOUR LE MONDE !');
});
