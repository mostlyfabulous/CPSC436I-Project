import React, { Component } from 'react';

import PrefEditor from './PrefEditor';
import { Spinner } from 'reactstrap';

class UserPref extends Component {

  render() {
    // console.log('user pref')
    // console.log(this.props.preferences)
    if (this.props.loadingPreferences === false && this.props.preferencesExists === true) {
        return (
            <PrefEditor preferences={this.props.preferences}/>
        );
    }
    //else return (<div className='spinner'/>);
    else return <div> <Spinner color="info" style={{ width: '10rem', height: '10rem' }}/> </div>;
  }
}

  export default UserPref;
