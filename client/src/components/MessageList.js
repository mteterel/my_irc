import React, {Component} from 'react';
import {Button, List} from "antd";
import Emojify from "react-emojione";

class MessageList extends Component {
    render() {
        return (
            <div>
                <List
                    size="small"
                    dataSource={this.props.messages}
                    renderItem={item => (
                        <List.Item>
                            {item.type === "system" && <span style={{fontWeight: "bold"}}>{item.content}</span>}
                            {item.type === "system_error" &&
                            <span style={{fontWeight: "bold", color: "red"}}>{item.content}</span>}
                            {item.type === "user" && <><span
                                style={{fontWeight: "bold"}}>{item.from}: </span><span><Emojify
                                style={styles.emoji}>{item.content}</Emojify></span></>}
                            {item.type === "whisper" && <><span style={{
                                fontWeight: "bold",
                                color: "magenta"
                            }}>from [{item.from}]: <Emojify
                                style={{height: 24, width: 24}}>{item.content}</Emojify></span></>}
                        </List.Item>
                    )}
                />
            </div>
        );
    }
}

const styles = {
    emoji: {
        height: 22,
        width: 22
    }
};

export default MessageList;
