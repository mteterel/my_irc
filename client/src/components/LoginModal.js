import React, {Component} from 'react';
import {Button, Form, Input, Modal} from "antd";

class LoginModal extends Component {
    static defaultProps = {
        onSubmitLogin: null
    };

    constructor(props) {
        super(props);
        this.state = {
            isError: false,
            isSubmitting: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(e) {
        this.setState({
            isError: false,
            userInput: e.target.value
        });
    }

    handleSubmit() {
        this.setState({isSubmitting: true});
        this.props.onSubmitLogin(this.state.userInput, (loginResult) => {
            this.setState({
                isSubmitting: false,
                isError: !loginResult
            });
        });
    }

    render() {
        return (
            <Modal
                title={"Login to my_irc"}
                visible={true}
                closable={false}
                footer={null}>
                <Form>
                    <Form.Item validateStatus={this.state.isError ? "error" : ""}
                               help={this.state.isError && "This nickname is already in use."}>
                        <Input placeholder={"Enter your nickname"} onChange={this.handleChange}/>
                    </Form.Item>
                    <Button type="primary" loading={this.state.isSubmitting} onClick={this.handleSubmit}>
                        Login
                    </Button>
                </Form>
            </Modal>
        );
    }
}

export default LoginModal;
