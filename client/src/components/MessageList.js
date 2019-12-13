import React, {Component} from 'react';
import {Button, List} from "antd";

class MessageList extends Component {
    render() {
        return (
            <div>
                <List
                    size="small"
                    dataSource={this.props.messages}
                    renderItem={item => (
                        <List.Item>
                            <span style={{fontWeight: "bold"}}>{item.type === "system" ? "[System Message]" : item.from}:&nbsp;</span>
                            <span>{item.content}</span>
                        </List.Item>
                    )}
                />
            </div>
        );
    }
}

export default MessageList;
