/**
 * Chat model events
 */

'use strict';

import {EventEmitter} from 'events';
var Chat = require('./chat.model');
var ChatEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
ChatEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Chat.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    ChatEvents.emit(event + ':' + doc._id, doc);
    ChatEvents.emit(event, doc);
  }
}

export default ChatEvents;
