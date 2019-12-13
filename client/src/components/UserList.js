import React, {Component} from 'react';
import {List, Tag} from 'antd';

class UserList extends Component {
    constructor(props) {
        super(props);
        this.renderUserItem = this.renderUserItem.bind(this);
    }

    renderUserItem(user) {
        return (
            <>
                <span>{user.nickname}</span>
                <div style={{marginLeft: '0.4em'}}>
                    {user.role === "admin" && <Tag color="magenta">Admin</Tag>}
                    {user.role === "operator" && <Tag color="green">Operator</Tag>}
                </div>
            </>
        )
    }

    render() {
        return (
            <List
                size="small"
                dataSource={this.props.users}
                renderItem={v => (
                    <List.Item>{this.renderUserItem(v)}</List.Item>
                )}
            />
        );
    }
}

export default UserList;
