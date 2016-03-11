'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));

var ChatSchema = new mongoose.Schema({
  name: String,
  isPrivate: Boolean,
  owner: String,
  participants: Object
});

// keep track of when todos are updated and created
ChatSchema.pre('save', function(next, done){
  if (this.isNew) {
    this.createdAt = Date.now();
  }
  this.updatedAt = Date.now();
  next();
});


export default mongoose.model('Chat', ChatSchema);
