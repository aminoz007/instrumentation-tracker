import React from 'react';
import { Progress, Table } from 'semantic-ui-react';
import { getHostCount } from './data';
import { Spinner } from 'nr1';

export default class InstrumentationTracker extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            infraConfig: []
        }
    }
    componentDidMount() {
        getHostCount().then(infraConfig => this.setState({infraConfig}))
    }
    countDetails(data, count, instrCount, progressColor) {
        return (
            <React.Fragment>
                {data[count]==='NA'?
                <Table.Cell textAlign='right'>Not Available</Table.Cell>:<Table.Cell textAlign='right'>{data[count]}</Table.Cell>}
                <Table.Cell textAlign='right'>{data[instrCount]}</Table.Cell>
                <Table.Cell textAlign='right'>
                    {data[count]==='NA'?
                        <Progress percent={0} color={progressColor} style={{margin:'5px'}} progress/>
                        :
                        <Progress percent={Math.round((data[instrCount]/data[count])*100)} color={progressColor} style={{margin:'5px'}} progress/>
                    }
                </Table.Cell>
            </React.Fragment>
        )
    }
    render() {
        const data = this.state.infraConfig
        return ( 
            <div style={{margin:'30px'}}> 
                {data.length?
                <Table celled structured>
                    <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell colSpan='2'/>
                        <Table.HeaderCell textAlign='center' colSpan='3' style={{background:'aquamarine'}}>Infra (On Prem)</Table.HeaderCell>
                        <Table.HeaderCell textAlign='center' colSpan='3'style={{background:'aqua'}}>Infra (Cloud)</Table.HeaderCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.HeaderCell>Group</Table.HeaderCell>
                        <Table.HeaderCell>Account ID</Table.HeaderCell>
                        <Table.HeaderCell>Current Host Count</Table.HeaderCell>
                        <Table.HeaderCell>Instrumented</Table.HeaderCell>
                        <Table.HeaderCell>% Instrumented</Table.HeaderCell>
                        <Table.HeaderCell>Current Host Count</Table.HeaderCell>
                        <Table.HeaderCell>Instrumented</Table.HeaderCell>
                        <Table.HeaderCell>% Instrumented</Table.HeaderCell>
                    </Table.Row>
                    </Table.Header>
                
                    <Table.Body>
                        {data.map((groupData,index) => { 
                            return (
                                <React.Fragment>
                                    <Table.Row key={index}>
                                    <Table.Cell style={{fontWeight:'bold', fontStyle:'italic'}} colSpan='2'>{groupData.group}</Table.Cell>
                                    {this.countDetails(groupData, "onPremHostCount", "instrOnPremHostCount", "blue")}
                                    {this.countDetails(groupData, "cloudHostCount", "instrCloudHostCount", "blue")}
                                    </Table.Row>
                                    {groupData.accounts.map((account,index) => {
                                        return (
                                            <Table.Row key={index}>
                                                <Table.Cell textAlign='right'>{account.accountName}</Table.Cell>
                                                <Table.Cell textAlign='right'>{account.accountId}</Table.Cell>
                                                {this.countDetails(account, "onPremHostCount", "instrOnPremHostCount", "orange")}
                                                {this.countDetails(account, "cloudHostCount", "instrCloudHostCount", "orange")}
                                            </Table.Row>
                                        )
                                    })}
                                </React.Fragment>
                            )
                        })}
                    </Table.Body>
                </Table> : <Spinner />}
            </div>
        )
    }
}
