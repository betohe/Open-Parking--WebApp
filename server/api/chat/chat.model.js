'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));

var ChatSchema = new mongoose.Schema({
  name: String,
  isPrivate: Boolean
});

export default mongoose.model('Chat', ChatSchema);
