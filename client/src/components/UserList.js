import React from 'react';

class UserList extends React.Component
{
    static defaultProps = {
        users: []
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <h1>List of Users</h1>
                <ul>
                    {this.props.users.map((value, index) => {
                        return <li key={index}>{value ? value.toString() : 'Unknown User'}</li>;
                    })}
                </ul>
            </div>
        );
    }
}

export default UserList;
