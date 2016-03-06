/**
 * Main application file
 */

'use strict';

import express from 'express';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import config from './config/environment';
import http from 'http';

// Connect to MongoDB
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
  console.error('MongoDB connection error: ' + err);
  process.exit(-1);
});

// Populate databases with sample data
if (config.seedDB) { require('./config/seed'); }

// Setup server
var app = express();
var server = http.createServer(app);
var socketio = require('socket.io')(server, {
  serveClient: config.env !== 'production',
  path: '/socket.io-client'
});
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

//require our websocket library 
var WebSocketServer = require('ws').Server; 

//creating a websocket server at port 9090 
var wss = new WebSocketServer({port: 9090}); 

//all connected to the server users
var users = {};
 
//when a user connects to our sever 
wss.on('connection', function(connection) { 
   console.log("user connected");
	
   //when server gets a message from a connected user 
    connection.on('message', function(message) { 
       var data; 
      
       //accepting only JSON messages 
       try { 
          data = JSON.parse(message); 
       } catch (e) { 
          console.log("Invalid JSON"); 
          data = {}; 
       } 

       //switching type of the user message 
       switch (data.type) { 
          //when a user tries to login 
          case "login": 
             console.log("User logged:", data.name); 
          
             //if anyone is logged in with this username then refuse 
             if(users[data.name]) { 
                sendTo(connection, { 
                   type: "login", 
                   success: false 
                }); 
             } else { 
                //save user connection on the server 
                users[data.name] = connection; 
                connection.name = data.name; 
            
                sendTo(connection, { 
                   type: "login", 
                   success: true 
                });
            
             } 
          
             break;
          case "offer": 
             //for ex. UserA wants to call UserB 
             console.log("Sending offer to: ", data.name); 
            
             //if UserB exists then send him offer details 
             var conn = users[data.name]; 
            
             if(conn != null){ 
                //setting that UserA connected with UserB 
                connection.otherName = data.name; 
              
                sendTo(conn, { 
                   type: "offer", 
                   offer: data.offer, 
                   name: connection.name 
                }); 
             }
            
             break;
          case "answer": 
             console.log("Sending answer to: ", data.name); 
            
             //for ex. UserB answers UserA 
             var conn = users[data.name]; 
            
             if(conn != null) { 
                connection.otherName = data.name; 
                sendTo(conn, { 
                   type: "answer", 
                   answer: data.answer 
                }); 
             }
            
             break;

          case "candidate": 
             console.log("Sending candidate to:",data.name); 
             var conn = users[data.name]; 
            
             if(conn != null) {
                sendTo(conn, { 
                   type: "candidate", 
                   candidate: data.candidate 
                }); 
             }
             else{
              console.log("No candidate with such name"); 
             }
            
             break;

          case "leave": 
             console.log("Disconnecting from", data.name); 
             var conn = users[data.name]; 
             conn.otherName = null; 
            
             //notify the other user so he can disconnect his peer connection 
             if(conn != null) { 
                sendTo(conn, { 
                   type: "leave" 
                }); 
             } 
            
             break;
               
          default: 
             sendTo(connection, { 
                type: "error", 
                message: "Command no found: " + data.type 
             }); 
          
             break; 
       } 
      
    });

    connection.on("close", function() { 
        if(connection.name) { 
            delete users[connection.name]; 
          
            if(connection.otherName) { 
               console.log("Disconnecting from ", connection.otherName); 
               var conn = users[connection.otherName]; 
               conn.otherName = null;
            
               if(conn != null) { 
                  sendTo(conn, { 
                     type: "leave" 
                  }); 
               }  
            } 
        } 
    });

   connection.send("Hello from server"); 
}); 

function sendTo(connection, message) { 
   connection.send(JSON.stringify(message)); 
}

// Start server
function startServer() {
  app.angularFullstack = server.listen(config.port, config.ip, function() {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

setImmediate(startServer);

// Expose app
exports = module.exports = app;
