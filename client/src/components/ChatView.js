import React, {Component} from 'react';
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import UserList from "./UserList";
import { Row, Col } from "antd";

class ChatView extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                <Row gutter={[16, 16]} type="flex" justify="space-around" align="middle">
                    <Col span={this.props.channel.name === "System" ? 24 : 18}>
                        <MessageList messages={this.props.channel.messages}/>
                        <MessageInput onSubmitMessage={this.props.onSubmitMessage}/>
                    </Col>
                    {this.props.channel.name !== "System" &&
                    <Col span={6} style={{ borderLeft: "1px solid #ccc" }}><UserList users={this.props.channel.users}/></Col>}
                </Row>
            </div>
        );
    }
}

export default ChatView;
