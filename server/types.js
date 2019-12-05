export class IRC_Client {
    socket = null;
    nickname = null;
    joinedChannels = [];

    constructor(socket) {
        this.socket = socket;
    }
}

export class IRC_Channel {
    name: null;
    users = [];

    constructor(name) {
        this.name = name;
    }
}