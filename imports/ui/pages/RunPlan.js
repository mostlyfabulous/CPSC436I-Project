import React from 'react';
import Info from '../Info.js';
import Login from '../Login.js';
import Calendar from '../Calendar.js';
import {connect} from 'react-redux';


class RunPlan extends React.Component {
    render() {
      // set logged in to true for now

      if (/*this.props.loggedIn*/ true === true) {
        return (
            <div className='body'>
                <div id='sideMenu'>
                    <Info/>
                </div>
                <div id='mainContent'>
                    <Calendar/>
                </div>
            </div>
        )
      } else {
        return (
            <div className='body'>
                <div id='sideMenu'>
                    <Info/>
                </div>
                <div id='mainContent'>
                    <Login/>
                </div>
            </div>
        )
      }

    }
}

const mapStateToProps = (state) => {
    return {
        loggedIn: state.LoggedIn
    };
}

export default connect(mapStateToProps)(RunPlan);
//
// export default connect(mapStateToProps)(Main);
//
// class RunPlan extends React.Component {
//
//     render() {
//       if ()
//         return (
//             <div className='body'>
//                 <div id='sideMenu'>
//                     <Info/>
//                 </div>
//                 <div id='mainContent'>
//                     <Calendar/>
//                 </div>
//             </div>
//         )
//     }
// }
//
//
// export default RunPlan;
