import React from 'react';
import './App.css';
import { IconSettings, TabsPanel, Tabs, Input } from '@salesforce/design-system-react';
import '@salesforce-ux/design-system/assets/styles/salesforce-lightning-design-system.min.css';

class App extends React.Component
{
    constructor(props) {
        super(props);
        this.state = {channels:[1,2,3,4,5]}
    }

    render() {
        return (
            <div className={"App"}>
                <IconSettings iconPath="/assets/icons">
                    <Tabs variant="scoped" id="tabs-example-scoped">
                        {this.state.channels.map((value, index) => {
                            return (<TabsPanel label={value.toString()} key={index}>
                                <div className="slds-grid slds-gutters ">
                                    <div className="slds-col slds-size_9-of-12 slds-border_top slds-border_bottom slds-border_left slds-border_right messages">
                                        <h1>Messages</h1>
                                        <ul>
                                            {this.state.channels.map((value, index) => {
                                                return <li value={index}>{value.toString()} </li>;
                                            })}
                                        </ul>
                                        <Input id="base-id"  placeholder="Message" />
                                    </div>
                                    <div className="slds-col slds-size_3-of-12 slds-border_top slds-border_bottom slds-border_left slds-border_right userList">
                                        <h1>List of Users</h1>
                                        <ul>
                                            {this.state.channels.map((value, index) => {
                                                return <li value={index}>{value.toString()} </li>;
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            </TabsPanel>)
                        })}
                    </Tabs>
                </IconSettings>
            </div>
        );
    }
}

export default App;
