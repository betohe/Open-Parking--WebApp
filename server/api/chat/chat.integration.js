'use strict';

var app = require('../..');
import request from 'supertest';

var newChat;

describe('Chat API:', function() {

  describe('GET /api/chats', function() {
    var chats;

    beforeEach(function(done) {
      request(app)
        .get('/api/chats')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          chats = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      chats.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/chats', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/chats')
        .send({
          name: 'New Chat',
          info: 'This is the brand new chat!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newChat = res.body;
          done();
        });
    });

    it('should respond with the newly created chat', function() {
      newChat.name.should.equal('New Chat');
      newChat.info.should.equal('This is the brand new chat!!!');
    });

  });

  describe('GET /api/chats/:id', function() {
    var chat;

    beforeEach(function(done) {
      request(app)
        .get('/api/chats/' + newChat._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          chat = res.body;
          done();
        });
    });

    afterEach(function() {
      chat = {};
    });

    it('should respond with the requested chat', function() {
      chat.name.should.equal('New Chat');
      chat.info.should.equal('This is the brand new chat!!!');
    });

  });

  describe('PUT /api/chats/:id', function() {
    var updatedChat;

    beforeEach(function(done) {
      request(app)
        .put('/api/chats/' + newChat._id)
        .send({
          name: 'Updated Chat',
          info: 'This is the updated chat!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedChat = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedChat = {};
    });

    it('should respond with the updated chat', function() {
      updatedChat.name.should.equal('Updated Chat');
      updatedChat.info.should.equal('This is the updated chat!!!');
    });

  });

  describe('DELETE /api/chats/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/chats/' + newChat._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when chat does not exist', function(done) {
      request(app)
        .delete('/api/chats/' + newChat._id)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
