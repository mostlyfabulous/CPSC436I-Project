import React from 'react';
import NextRunInfo from './nextRunInfo.js';
import HomeStats from './homeStats.js';

class NextRun extends React.Component {
    render() {
        let nextRun = ""
        if (this.props.loadingNext === false && this.props.nextExists === true){
            return <NextRunInfo runs={this.props.nextEvent}/>
        }
        let stats = "";
        if (this.props.loadingRuns === false && this.props.runsExists === true){
            return <HomeStats runs={this.props.runEvents}/>
        }
        return <div className='spinner'/>
    }
}

export default NextRun;