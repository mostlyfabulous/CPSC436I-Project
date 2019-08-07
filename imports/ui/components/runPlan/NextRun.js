import React, { Component } from 'react';
import { connect } from 'react-redux';
import { addEvent, getNextRun } from '../../actions/index'
import {bindActionCreators} from 'redux'

import { Form, FormGroup, Label, Input, FormFeedback, FormText } from 'reactstrap';
import { Card, CardImg, CardText, CardBody,
  CardTitle, CardSubtitle, Button, CardHeader } from 'reactstrap';
import { Container, Row, Col } from 'reactstrap';

var moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format");
const VALID_START = 6;
const VALID_END = 21;
momentDurationFormatSetup(moment);

class NextRun extends Component {
  // static propTypes = {
  //   weatherReady: PropTypes.bool.isRequired,
  //   weatherEvents: PropTypes.array.isRequired,
  //   //weatherSubscriptionStopped: PropTypes.bool.isRequired,
  //   //calendarReady: PropTypes.bool.isRequired,
  //   calendarEvents: PropTypes.array.isRequired,
  //   //calendarSubscriptionStopped: PropTypes.bool.isRequired,
  //   preferencesReady: PropTypes.bool.isRequired,
  //   preferencesEvents: PropTypes.array.isRequired,
  // }

  constructor(props) {
    super(props);
    this.state = {
      nextRun: {}
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleChange(event) {
    this.setState({duration: event.target.duration});
  }

  sortByStart(eventList) {
    let sortedList = eventList;
    sortedList.sort(function (a, b) {
      if (a.start && b.start) {
        var key1 = a.start;
        var key2 = b.start;

        if (key1 < key2) {
          return -1;
        } else if (key1 == key2) {
          return 0;
        } else {
          return 1;
        }
      }
    });
    return sortedList;
  }

  handleSubmit(e) {
    event.preventDefault();
    let duration = parseInt(e.target.duration.value);
    let eventDuration = moment.duration(duration, "minutes").format("mm:ss:SS");
    let i = 0;
    let suggestions = [];
    let now = new Date();
    let combinedEvents = this.props.calendarEvents.concat(this.props.googleEvents);
    let futureEvents = combinedEvents.filter(run => run.start >= now);
    let freeEvents = [];

    let sortedWeather = this.props.weatherEvents.filter(weather => weather.start >= now);
    sortedWeather = this.sortByStart(sortedWeather);

    futureEvents = this.sortByStart(futureEvents);

    let eventNow = {
      start: now,
      end: now
    };
    futureEvents.splice(0,0,eventNow);

    let lastFutureEvent = {
      start: sortedWeather[sortedWeather.length-1].end,
      end: sortedWeather[sortedWeather.length-1].end
    };

    futureEvents.push(lastFutureEvent);

    for (let i = 0; i < futureEvents.length-1; i++) {
      let current = futureEvents[i].end;
      let next = futureEvents[i+1].start;
      if (current.getDate() !== next.getDate()) {
        let start = new Date(current);
        start.setHours(VALID_END,0,0,0);
        let end = new Date(current);
        end.setDate(current.getDate()+1);
        end.setHours(VALID_START,0,0,0);
        let blockEvent = {
          start: start,
          end: end
        };
        futureEvents.splice(i+1,0,blockEvent);
      }
    }

    let firstFreeEvent = {};
    firstFreeEvent.start = now;
    firstFreeEvent.end = futureEvents[0].start;
    freeEvents.push(firstFreeEvent);

    for (let i = 0; i < futureEvents.length-1; i++){
      if (futureEvents[i].end.getTime() !== futureEvents[i+1].start.getTime()){
        let freeEvent = {};
        freeEvent.start = futureEvents[i].end;
        freeEvent.end = futureEvents[i+1].start;
        freeEvents.push(freeEvent)
      }
    }
    //freeEvents.push(lastFreeEvent);

    let freeEventsDurationFilter = freeEvents.filter(function(free) {
      let freeDuration = (free.end-free.start)/60000;
      return freeDuration > duration;
    });
    console.log('free events duration filter')
    console.log(freeEventsDurationFilter);

    let freeEventsWeatherFilter = [];
    let freeEventsWeatherFilterTemp = [];
    let tempVariance = [];
    let medianTemp = (this.props.preferencesEvents[0].max_temp + this.props.preferencesEvents[0].min_temp)/2;
    for (let entry of freeEventsDurationFilter) {
      for (let i = 0; i < sortedWeather.length-1; i++) {
        if ((entry.start >= sortedWeather[i].start) && (entry.start <= sortedWeather[i+1].start)){
          // console.log('comparing');
          // console.log(entry);
          // console.log(sortedWeather[i]);
          // console.log(sortedWeather[i+1])
          //let avg = (this.props.preferencesEvents[0].max_temp - this.props.preferencesEvents[0].min_temp)/2;
          let maxCond = this.props.preferencesEvents[0].max_temp >= (sortedWeather[i].temp -273.15);
          let minCond = this.props.preferencesEvents[0].min_temp <= (sortedWeather[i].temp -273.15);
          if (maxCond && minCond) {
            freeEventsWeatherFilterTemp.push(entry);
            tempVariance.push(Math.abs((sortedWeather[i].temp -273.15)-medianTemp));
          }
          // if ( (diffMax <= avg) && (diffMin <= avg)) {
          //   freeEventsWeatherFilterTemp.push(entry);
          // }
          // console.log(maxCond)
          // console.log(minCond)
        }
      }

    }

    if (freeEventsWeatherFilterTemp.length < 3){
      freeEventsWeatherFilter = freeEventsDurationFilter;
      tempVariance = [];
    } else {
      freeEventsWeatherFilter = [...new Set(freeEventsWeatherFilterTemp)];
    }

    //let freeEventsGapFilter = freeEventsWeatherFilter.filter(run => run.start-run.end >= now);
    //console.log('filtered weather')
    //console.log(freeEventsWeatherFilter);
    let totalDuration = (this.props.preferencesEvents[0].min_duration)*2 + duration/60;
    let freeEventsGapFilterTemp = [];
    let tempVarianceFilter = [];

    for (let i = 0; i < freeEventsWeatherFilter.length; i++){
      let entry = freeEventsWeatherFilter[i];
      let freeRange = (entry.end - entry.start)/3600000; // in Hours
      if (freeRange >= totalDuration){
        let newGap = {};
        let newStart = moment(entry.start).add(this.props.preferencesEvents[0].min_duration, 'hours').format();
        let newStartUNIX = Date.parse(newStart);
        newGap.start = new Date(newStartUNIX);

        let newEnd = moment(entry.end).subtract(this.props.preferencesEvents[0].min_duration, 'hours').format();
        let newEndUNIX = Date.parse(newEnd);
        newGap.end = new Date(newEndUNIX);
        freeEventsGapFilterTemp.push(newGap);
        if (tempVariance.length > 0) {
          tempVarianceFilter.push(tempVariance[i]);
        }
      }
    }
    //
    // console.log('FINAL FILTER')
    // console.log(freeEventsGapFilterTemp)

    let freeEventsGapFilter = [];
    tempVariance = tempVarianceFilter;
    tempVarianceFilter = [];

    if (freeEventsGapFilterTemp.length < 1) {
      freeEventsGapFilter = freeEventsWeatherFilter;
    } else {
      freeEventsGapFilter = freeEventsGapFilterTemp;
    }
    // console.log('weather in next run: ')
    // console.log(this.props.weatherEvents);
    // console.log(this.props.calendarEvents)
    // console.log(this.props.preferencesEvents)

    let timeFilter = [];
    //freeEventsGapFilter.forEach(function (gap)
    for (let i = 0; i < freeEventsGapFilter.length; i++) {
      let gap = freeEventsGapFilter[i];
      let gapStart = gap.start.getHours();
      let gapEnd = gap.end.getHours();
      if ((VALID_START < gapStart && gapStart < VALID_END) && (VALID_START < gapEnd && gapEnd < VALID_END)){
        timeFilter.push(gap);
        if (tempVariance.length > 0) {
          tempVarianceFilter.push(tempVariance[i]);
        }
      }
    }

    suggestions = timeFilter;
    console.log('run suggestions');
    console.log(suggestions);

    // while ((i < (this.props.calendarEvents.length-1)) && (suggestions.length < 1)) {
    //   var diff = this.props.calendarEvents[i+1].start - this.props.calendarEvents[i].end;
    //   if ((diff >= duration) && (this.props.calendarEvents[i].end !== null) && (this.props.calendarEvents[i].end >= now)) {
    //     console.log(this.props.calendarEvents[i].end)
    //     suggestions.push(this.props.calendarEvents[i].end);
    //   }
    //   i++;
    // }
    if (suggestions.length > 0) {
      console.log('s[0] true')
      console.log(suggestions[0])

      console.log(tempVariance);
      let period = suggestions[0];
      if (tempVariance.length > 0) {
        let i = tempVariance.indexOf(Math.min(...tempVariance));
        console.log(i);
        console.log(tempVariance[i]);
        period = suggestions[i];
      }

      let unique = (Date.parse(new Date)).toString(16) + Math.floor(Math.random()*1000);
      let endTime = moment(period.start).add(duration, 'minutes').format();
      let endTimeUNIX = Date.parse(endTime);
      let endTimeFormatted = new Date(endTimeUNIX);
      let newEvent = {
        id: unique,
        _id: unique,
        title: "Suggested Run",
        start: period.start,//e.date, // TODO: determine how to set timezone if needed
        end: endTimeFormatted,
        duration: moment.duration(duration, 'minutes'),
        allDay: false, //e.allDay,
        distance: 5,
        category: "run",
        owner: Meteor.userId(),//this.props.account.userId,
        username: Meteor.user().username,//this.props.account.user.username,
      }
      console.log('newEvent in plan a run')
      console.log(newEvent)
      this.props.addEvent(newEvent);
    } else {
      let unique = (Date.parse(new Date)).toString(16) + Math.floor(Math.random()*1000);
      let length = this.props.calendarEvents.length;
      let start = this.props.calendarEvents[length-1].end;
      let startOffset = moment(start).add(this.props.preferencesEvents[0].min_duration, 'hours').format();
      let startTime = moment(startOffset).format();
      let startUNIX = Date.parse(startTime);
      let startFormatted = new Date(startUNIX);
      let end = startOffset;
      let endTime = moment(end).add(duration, 'minutes').format();
      let endTimeUNIX = Date.parse(endTime);
      let endTimeFormatted = new Date(endTimeUNIX);
      let newEvent = {
        id: unique,
        _id: unique,
        title: "Suggested Run",
        start: startFormatted,//e.date, // TODO: determine how to set timezone if needed
        end: endTimeFormatted,// moment(suggestions[0]).add(duration, 'minutes').format(),
        duration: moment.duration(duration, 'minutes'),
        allDay: false, //e.allDay,
        distance: 5,
        category: "run",
        owner: Meteor.userId(),//this.props.account.userId,
        username: Meteor.user().username,//this.props.account.user.username,
      }
      console.log('newEvent in plan a run')
      console.log(newEvent)
      this.props.addEvent(newEvent);
    }
  }

  render() {


    let eventDuration = "";
    const {title, start, end, extendedProps} = this.props.nextRun;;
    if (end) {
      // see duration formatting options here: https://github.com/jsmreese/moment-duration-format
      eventDuration = moment.duration(moment(end).diff(moment(start))).format("h [hrs], m [min]");
      // console.log(eventDuration);
    }


      return (
            <div>
              <Card>
              <CardHeader tag="h2"> Your Next Run</CardHeader>
              <CardBody>
              <Form onSubmit={this.handleSubmit} ref='form'>
              <FormGroup>
                <Label htmlFor="duration">Duration (in minutes)</Label>
                <Row>
                <Col md={5}>
                  <Input type="number" id="duration" placeholder={"minutes"} />
                </Col>

                <Col md={7}>
                  <Button color="info" type="submit"> Find a Run! <i className="search icon"> </i></Button>
                </Col>
                </Row>
              </FormGroup>
              </Form>
              </CardBody>
              </Card>
            </div>
      )
  }

  componentWillReceiveProps(nextProps) {
    this.props.getNextRun(nextProps.calendarEvents)
  }
}

const mapStateToProps = (state) => {
  return {
            nextRun: state.nextRun,
            calendarEvents: state.calendar.calendarEvents,
            googleEvents: state.calendar.googleEvents,
            weatherEvents: state.weatherMiddleware.weatherEvents,
            weatherReady: state.weatherMiddleware.weatherReady,
            preferencesEvents: state.preferences.preferencesEvents,
         };
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      addEvent,
      getNextRun
    },
    dispatch
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(NextRun);
