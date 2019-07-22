import React from 'react';
import NextRunInfo from './nextRunInfo.js';
import HomeStats from './homeStats.js';

class SideInfo extends React.Component {
    render() {
        if (this.props.loadingNext === false && this.props.nextExists === true){
            return <NextRunInfo runs={this.props.nextEvent}/>
        }
        if (this.props.loadingRuns === false && this.props.runsExists === true){
            return <HomeStats runs={this.props.runEvents}/>
        }
        return <div className='spinner'/>
    }
}

export default SideInfo;