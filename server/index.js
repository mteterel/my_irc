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

    const NICK_CHANGE_REQ = (nickname) => {
        let alreadyExists = false;
        users.forEach((v) => {
            if (v.nickname === nickname)
                alreadyExists = true;
        });

        if (alreadyExists) {
            socket.emit('NICK_CHANGE_ACK', nickname, false);
            return false;
        }

        const previousNick = user.nickname;
        user.nickname = nickname;
        socket.emit('NICK_CHANGE_ACK', nickname, true);

        if (false === user.justLoggedIn)
            user.channels.forEach(v => server.to(v.name).emit('NICK_CHANGE_INF', previousNick, nickname));
        else
            user.justLoggedIn = false;

        return true;
    };

    socket.on("NICK_CHANGE_REQ", (nickname, callback) => {
        return callback(NICK_CHANGE_REQ(nickname));
    });

    const JOIN_CHANNEL_REQ = (channelName) => {
        channelName = utils.formatChannelName(channelName);
        if (false === channels.has(channelName))
            return false;

        const channel = channels.get(channelName);
        if (user.channels.includes(channel))
            return false;

        server.to(channelName).emit("CHANNEL_USER_JOIN_INF", channelName, user.nickname);
        socket.join(channelName, (err) => {
            user.channels.push(channel);
            channel.users.push({ role: 'user', nickname: user.nickname });
            socket.emit('CHANNEL_JOIN_ACK', channelName, channel.users, channel.messages);
        });
        return true;
    };

    const LEAVE_CHANNEL_REQ = (channelName) => {
        channelName = utils.formatChannelName(channelName);
        if (false === channels.has(channelName))
            return false;

        let channel = channels.get(channelName);
        if (false === user.channels.includes(channel))
            return false;

        server.to(channelName).emit("CHANNEL_USER_LEAVE_INF", channelName, user.nickname, 'User Leave');
        socket.leave(channelName, () => {
            channel.users = channel.users.filter(v => v.nickname !== user.nickname);
            user.channels = user.channels.filter(v => v.name !== channel.name);
            socket.emit('CHANNEL_LEAVE_ACK', channelName);

            if (channel.users.length <= 0)
                channels.delete(channelName);
        });

        return true;
    };

    const CREATE_CHANNEL_REQ = (channelName) => {
        channelName = utils.formatChannelName(channelName);
        if (true === channels.has(channelName))
            return false;

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
        return true;
    };

    const DESTROY_CHANNEL_REQ = (channelName) => {
        channelName = utils.formatChannelName(channelName);
        if (false === channels.has(channelName))
            return false;

        const channel = channels.get(channelName);
        if (false === channel.users.find(v => v.nickname === user.nickname && v.role === "admin"))
            return false;

        server.to(channelName).emit('CHANNEL_LEAVE_ACK', channelName);
        server.in(channelName).clients((error, clients) => {
            for(let client of clients) {
                const otherSocket = server.sockets.connected[client];
                otherSocket.user.channels = otherSocket.user.channels.filter(v => v.name !== channelName);
                otherSocket.leave(channelName);
            }
        });
        channels.delete(channelName);
        return true;
    };

    const WHISPER_MESSAGE_REQ = (commandArray) => {

    };

    socket.on('CHANNEL_MESSAGE_REQ', (channelName, message) => {
        channelName = utils.formatChannelName(channelName);
        if (message.startsWith('/')) {
            const commandArray = [...message.matchAll(/("[^"]+"|[^ ]+)/gim)];
            const commandName = commandArray[0][0];

            try {
                console.log(JSON.stringify(commandArray));
                switch (commandName) {
                    case "/join":
                        JOIN_CHANNEL_REQ(commandArray[1][0]);
                        break;
                    case "/leave":
                        LEAVE_CHANNEL_REQ(commandArray[1][0]);
                        break;
                    case "/create":
                        CREATE_CHANNEL_REQ(commandArray[1][0]);
                        break;
                    case "/delete":
                        DESTROY_CHANNEL_REQ(commandArray[1][0]);
                        break;
                    case "/nick":
                        NICK_CHANGE_REQ(commandArray[1][0]);
                        break;
                    case "/list":
                        const allChannels = [];
                        channels.forEach(v => allChannels.push(v.name));
                        socket.emit('CHANNEL_LIST_INF', allChannels.length, allChannels);
                        break;
                    case "/users":
                        const allUsers = [];
                        const channel = channels.get(channelName);
                        channel.users.forEach(v => allUsers.push(v.nickname));
                        socket.emit('CHANNEL_USER_LIST_INF', allUsers.length, allUsers);
                        break;
                    case "/msg":
                        WHISPER_MESSAGE_REQ(commandArray);
                        break;
                    default:
                        socket.emit("SERVER_ERROR_INF", "Unknown command. Type /help for a list");
                        break;
                }
            }
            catch(err) {
                socket.emit("SERVER_ERROR_INF", `An error occurred while processing the command: ${err.toString()}`);
            }
        }
        else
        {
            const channel = channels.get(channelName);
            if (channel) {
                channel.messages.push({
                    type: "user",
                    from: user.nickname,
                    content: message
                });
                server.to(channelName).emit("CHANNEL_MESSAGE_INF", channelName, user.nickname, message);
            }
        }
    });

    socket.on('disconnect', () => {
        socket.leaveAll();
        user.channels.forEach(v => {
            v.users = v.users.filter(w => w.nickname !== user.nickname);

            if (v.users.length <= 0)
                channels.delete(v.name);
            else
                server.to(v.name).emit("CHANNEL_USER_LEAVE_INF", v.name, user.nickname, 'IRC Quit');
        });
        user.channels = [];
            users.delete(socket.id);
    });
});
