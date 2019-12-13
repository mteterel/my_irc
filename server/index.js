const io = require('socket.io');
const utils = require('./utils');

const users = new Map();
const channels = new Map();

const server = io.listen(6112);
server.on('connection', (socket) => {
    console.log("new connection");

    const user = {
        id: socket.id,
        nickname: "",
        channels: [],
        justLoggedIn: true
    };
    users.set(socket.id, user);
    socket.user = user;

    socket.on('NICK_CHANGE_REQ', (nickname, callback) => {
        let alreadyExists = false;
        users.forEach((v) => {
            if (v.nickname === nickname)
                alreadyExists = true;
        });

        if (alreadyExists) {
            socket.emit('NICK_CHANGE_ACK', nickname, false);
            return callback(false);
        }

        const previousNick = user.nickname;
        user.nickname = nickname;
        socket.emit('NICK_CHANGE_ACK', nickname, true);

        if (false === user.justLoggedIn)
            user.channels.forEach(v => server.to(v.name).emit('NICK_CHANGE_INF', previousNick, nickname));
        else
            user.justLoggedIn = false;

        return callback(true);
    });

    socket.on('JOIN_CHANNEL_REQ', (channelName, callback) => {
        if (false === channels.has(channelName))
            return callback(false);

        const channel = channels.get(channelName);
        if (user.channels.includes(channel))
            return callback(false);

        server.to(channelName).emit("CHANNEL_USER_JOIN_INF", channelName, user.nickname);
        socket.join(channelName, (err) => {
            user.channels.push(channel);
            channel.users.push({ role: 'user', nickname: user.nickname });
            socket.emit('CHANNEL_JOIN_ACK', channelName, channel.users, channel.messages);
        });
        return callback(true);
    });

    socket.on('LEAVE_CHANNEL_REQ', (channelName, callback) => {
        if (false === channels.has(channelName))
            return callback(false);

        const channel = channels.get(channelName);
        if (false === user.channels.includes(channel))
            return callback(false);

        server.to(channelName).emit("CHANNEL_USER_LEAVE_INF", channelName, user.nickname, 'User Leave');
        socket.leave(channelName, () => {
            channel.users = channel.users.filter(v => v.id !== socket.id);
            user.channels = user.channels.filter(v => v !== channel);
            socket.emit('CHANNEL_LEAVE_ACK', channelName);
        });
        return callback(true);
    });

    socket.on('CREATE_CHANNEL_REQ', (channelName, callback) => {
        if (true === channels.has(channelName))
            return callback(false);

        const channel = {
            name: channelName,
            messages: [{ type: 'system', content: `Channel ${channelName} has just been created.`}],
            users: [{ role: 'admin', nickname: user.nickname }]
        };
        channels.set(channelName, channel);

        socket.join(channelName, (err) => {
            user.channels.push(channel);
            socket.emit('CHANNEL_JOIN_ACK', channelName, channel.users, channel.messages);
        });
        return callback(true);
    });

    socket.on('DESTROY_CHANNEL_REQ', (channelName, callback) => {
        if (false === channels.has(channelName))
            return callback(false);

        const channel = channels.get(channelName);
        if (false === channel.users.find(v => v.nickname === user.nickname && v.role === 'admin'))
            return callback(false);

        socket.to(channelName).emit('CHANNEL_LEAVE_ACK', channelName);
        server.in(channelName).clients((error, clients) => {
            for(let client of clients) {
                const otherSocket = server.sockets.connected[client];
                // TODO: remove channels from user array
                otherSocket.user.channels = otherSocket.user.channels.filter(v => v.name !== channelName);
                otherSocket.leave(channelName);
            }
        });
        channels.delete(channelName);
        return callback(true);
    });

    socket.on('CHANNEL_MESSAGE_REQ', (channelName, message) => {
        if (message.startsWith('/')) { /* TODO: process command */ }
        else if (message.startsWith('@')) { /* TODO: process whisper */ }
        else if (message === 'list') {
            const allChannels = [];
            channels.forEach(v => allChannels.push(v.name));
            socket.emit('CHANNEL_LIST_INF', allChannels.length, allChannels);
        }
        else if (message === 'users') {
            const allUsers = [];
            const channel = channels.get('#webacademie');
            channel.users.forEach(v => allUsers.push(v.nickname));
            socket.emit('CHANNEL_USER_LIST_INF', allUsers.length, allUsers);
        }
        else
        {
            const messageObj = {
                type: "user",
                from: user.nickname,
                content: message
            };
            const channel = channels.get(channelName);
            if (channel) {
                channel.messages.push(messageObj);
                server.to(channelName).emit("CHANNEL_MESSAGE_INF", channelName, user.nickname, message);
            }
        }
    });

    socket.on('disconnect', () => {
        socket.leaveAll();
        user.channels.forEach(v => {
            v.users = v.users.filter(v => v.nickname !== user.nickname);
            server.to(v.name).emit("CHANNEL_USER_LEAVE_INF", v.name, user.nickname, 'IRC Quit');
        });
        user.channels = [];
        users.delete(socket.id);
    });
});
