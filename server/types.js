export class IRC_Client {
    constructor(socket) {
        this.socket = socket;
        this.nickname = null;
        this.joinedChannels = [];
    }

    hasJoinedChannel(channel) {
        return this.joinedChannels.includes(channel);
    }
}

export class IRC_Channel {
    constructor(name) {
        this.name = name;
        this.users = [];
        this.messages = [];
    }

    hasUser(user) {
        return this.users.includes(user);
    }

    broadcast(type, data) {
        this.users.forEach((u) => {
            u.socket.emit(type, data);
        });
    }
}
