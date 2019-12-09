import io from 'socket.io-client';
import messages from './messages';

export default class IRC_Client {
    socket = null;

    constructor() {

    }

    connect(callback) {
        this.socket = io("http://localhost:6112");
        this.socket.on('connect', () => {
            console.log("Socket client connected successfully");
            callback();
        });
    }

    processInputAndSend(input) {

    }
}
