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
                            {item.type === "system" && <span style={{fontWeight: "bold"}}>{item.content}</span>}
                            {item.type !== "system" && <><span style={{fontWeight: "bold"}}>{item.from}:</span><span>{item.content}</span></>}
                        </List.Item>
                    )}
                />
            </div>
        );
    }
}

export default MessageList;
