import { Meteor } from 'meteor/meteor';
import React from 'react';
import Runs from '../../api/runs.js';
import { STOP_SUBSCRIPTION } from 'meteor-redux-middlewares';

import {
  WEATHER_SUBSCRIPTION_READY,
  WEATHER_SUBSCRIPTION_CHANGED,
  WEATHER_SUB,
  RUNS_SUBSCRIPTION_READY,
  RUNS_SUBSCRIPTION_CHANGED,
  RUNS_SUB,
  ADD_EVENT, RENAME_EVENT, DRAG_EVENT
} from '../actions/index';
calendarRef = React.createRef()

const initialWeatherState = {
  weatherReady: false,
  weatherEvents: [],
  weatherSubscriptionStopped: false,
};

export function weatherReducerMiddleware(state = initialWeatherState, action) {
  switch (action.type) {
    case WEATHER_SUBSCRIPTION_READY:
      return {
        ...state,
        weatherReady: action.payload.ready,
      };
    case WEATHER_SUBSCRIPTION_CHANGED:
      return {
        ...state,
        weatherEvents: action.payload,
      };
    case STOP_SUBSCRIPTION: // currently don't need to stop a sub
      return action.payload === WEATHER_SUB
        ? { ...state, weatherSubscriptionStopped: true }
        : state;
    default:
      return state;
  }
}

const initialCalendarState = {
  calendarReady: false,
  calendarEvents: [],
  calendarSubscriptionStopped: false,
};

export function calendarEventsReducer(state = initialCalendarState, action) {
  switch (action.type) {
    case RUNS_SUBSCRIPTION_READY:
      return {
        ...state,
        calendarReady: action.payload.ready,
      };
    case RUNS_SUBSCRIPTION_CHANGED:
      return {
        ...state,
        calendarEvents: action.payload,
      };
    case STOP_SUBSCRIPTION: // currently don't need to stop a sub
      return action.payload === RUNS_SUB
        ? { ...state, calendarSubscriptionStopped: true }
        : state;

	case ADD_EVENT:
    let newEvent = action.calendarEvent;
    console.log(newEvent);
    Runs.insert(newEvent); // any security needed here?
    // concat allows an array of events to be added vs [...events, event(s)]
    return {
      ...state,
      calendarEvents: [...state.calendarEvents.concat(newEvent)]
    }

  case RENAME_EVENT:
  // TODO: delete this as DRAG_EVENT is the succesor
    console.log("rename event fire");
    let e = action.id
    if (action.newName) {
      let targetID = state.calendarEvents.findIndex(function (event) {
        return e.id === event.id;
      });
      return state.calendarEvents.map((event, index) => {
        if (index !== targetID) {
          return event
        }
        let updatedEvent = {...event};
        console.log(updatedEvent);
        updatedEvent.title = action.newName;
        return updatedEvent;
        });
      } else {
        console.log("Invalid name passed was:" + action.newName);
        return state;
      }


  case DRAG_EVENT:
    console.log("event drag fire");
    let de = action.calendarEvent
    // console.log(de);
    let modifiedEvent = {
      id     : de.event.id,
      _id    : de.event.id,
      title : de.event.title,
      start : de.event.start,
      end : de.event.end,
      allDay: de.allDay,
      distance: de.event.extendedProps.distance,
      duration: de.event.extendedProps.duration,
      category: de.event.extendedProps.category,
      owner: de.event.extendedProps.owner,
      username: de.event.extendedProps.username,
    }
    // https://docs.meteor.com/api/collections.html#modifiers
    // Without using $-operators, a modifier is interpreted as a literal document,
    // and completely replaces whatever was previously in the database.
    // Find the document with ID 'de.id' and completely replace it.
    Runs.update({_id: de.event.id}, modifiedEvent, function (err, docsChanged) {
      if (err) console.log(err);
      // console.log("event had id: " + de.event.id);
      // console.log(docsChanged + " documents were changed");
    })

    // console.log(modifiedEvent);
    return { ...state,
      calendarEvents: [...state.calendarEvents.filter( (event) => {
        return event.id !== (de.event.id)
      }), modifiedEvent]
    }

  default:
    return state;
  }
}
