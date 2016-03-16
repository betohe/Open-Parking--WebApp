var async = require('async');
var express = require('express');
var http = require('http');
var WebSocketServer = require("ws").Server

var bodyParser = require('body-parser');
var sockio = require("socket.io");
var r = require('rethinkdb');

var config = require(__dirname + '/config.js');

var app = require('express')();
var io = require('socket.io');
//server.listen(config.socketio.port);
console.log("Server started on port " + config.socketio.port);

//For serving the index.html and all the other front-end assets.
app.use(express.static(__dirname + '/client'));

var server = http.createServer(app);
server.listen(process.env.PORT || config.express.port);

console.log("http server listening on %d", process.env.PORT || config.express.port);

var wss = new WebSocketServer({server: server});
console.log("websocket server created");

app.use(bodyParser.json());

//The REST routes for "zones".
app.route('/zones')
  .get(listZoneItems)
  .post(createZoneItem);

app.route('/zones/:id')
  .get(getZoneItem)
  .put(updateZoneItem)
  .delete(deleteZoneItem);

app.route('/enterzone/:id')
  .put(enterZoneItem);

app.route('/leavezone/:id')
  .put(leaveZoneItem);

//If we reach this middleware the route could not be handled and must be unknown.
app.use(handle404);

//Generic error handling middleware.
app.use(handleError);

//all connected to the server users
var users = {};
var usersIDs = [];

/*
 * Socket.io
 */

wss.on("connection", function(socket) {

  console.log('a user connected');

  socket.send("Hello from server"); 
  socket.emit('welcome', { message: 'Welcome!', id: socket.id });

  socket.on("updatezone", function(zone){
    console.log("Zone updated: "+zone.id+", action: "+zone.action);
    socket.broadcast.emit('updatezone', zone);
  });

  socket.on("zonecreated", function(zone){
    console.log("Zone created: "+zone.id);
    socket.broadcast.emit('newzone', zone);
  });

 //when server gets a message from a connected user 
  socket.on('message', function(message) { 
       var data; 
        
        console.log(data);
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
             console.log("User logged:", data.id); 
          
             //if anyone is logged in with this username then refuse 
             if(users[data.id]) { 
                sendTo(socket, { 
                   type: "login", 
                   success: false 
                }); 
             } else { 
                //save user socket on the server 
                users[data.id] = socket; 
                usersIDs.push(data.id);
                socket.id = data.id; 
            
                sendTo(socket, { 
                   type: "login", 
                   success: true 
                });
            
             } 
          
             break;
          case "zonecreated": 
             //for ex. UserA wants to call UserB 
             //console.log("Zone created: "+data.savedZone.id);
             //console.log("Sending offer to: ", data.name); 
            
             //if UserB exists then send him offer details 
             for (var i = 0; i < usersIDs.length; i++){
               if(users[usersIDs[i]] != null){
                  
                sendTo(users[usersIDs[i]], { 
                   type: "newzone", 
                   zone: data.savedZone
                });  
               }
             }
             break;
          case "answer": 
             console.log("Sending answer to: ", data.name); 
            
             //for ex. UserB answers UserA 
             var conn = users[data.name]; 
            
             if(conn != null) { 
                socket.otherName = data.name; 
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
            
             //notify the other user so he can disconnect his peer socket 
             if(conn != null) { 
                sendTo(conn, { 
                   type: "leave" 
                }); 
             } 
            
             break;
               
          default: 
             sendTo(socket, { 
                type: "error", 
                message: "Command no found: " + data.type 
             }); 
          
             break; 
       } 
      
    });

    socket.on("close", function() { 
        if(socket.id) { 
            usersIDs.splice(usersIDs.indexOf(socket.id), 1);
            delete users[socket.id]; 
            //console.log(usersIDs.length);
            //console.log("user gone");
        } 
    });

  var conn;
  r.connect(config.rethinkdb).then(function(c) {
    conn = c;
    return r.table('zones').orderBy({index: 'createdAt'})
      .limit(60).run(conn);
  })
  .then(function(cursor) { return cursor.toArray(); })
  .then(function(result) {
    socket.emit("zones", result);
  })
  .error(function(err) { console.log("Failure:", err); })
  .finally(function() {
    if (conn)
      conn.close();
  });
});


function sendTo(socket, message) { 
   socket.send(JSON.stringify(message)); 
}

/*
 * Retrieve all zone items.
 */
function listZoneItems(req, res, next) {
  r.table('zones').orderBy({index: 'createdAt'}).run(req.app._rdbConn, function(err, cursor) {
    if(err) {
      return next(err);
    }

    //Retrieve all the zones in an array.
    cursor.toArray(function(err, result) {
      if(err) {
        return next(err);
      }

      res.json(result);
    });
  });
}

/*
 * Insert a new zone item.
 */
function createZoneItem(req, res, next) {
  var zoneItem = req.body;
  zoneItem.createdAt = r.now();

  console.dir(zoneItem);

  r.table('zones').insert(zoneItem, {returnChanges: true}).run(req.app._rdbConn, function(err, result) {
    if(err) {
      return next(err);
    }

    res.json(result.changes[0].new_val);
  });
}

/*
 * Get a specific zone item.
 */
function getZoneItem(req, res, next) {
  var zoneItemID = req.params.id;

  r.table('zones').get(zoneItemID).run(req.app._rdbConn, function(err, result) {
    if(err) {
      return next(err);
    }

    res.json(result);
  });
}

/*
 * Update a zone item.
 */
function updateZoneItem(req, res, next) {
  var zoneItem = req.body;
  var zoneItemID = req.params.id;

  r.table('zones').get(zoneItemID).update(zoneItem, {returnChanges: true}).run(req.app._rdbConn, function(err, result) {
    if(err) {
      return next(err);
    }

    res.json(result.changes[0].new_val);
  });
}

/*
 * Zone Item take place
 */

 function enterZoneItem(req, res, next) {
  var zoneItemID = req.params.id;

  r.table('zones').get(zoneItemID).run(req.app._rdbConn, function(err, result) {
    if(err) {
      return next(err);
    }

    result.full++;
    for (var i = 0; i < usersIDs.length; i++){
               if(users[usersIDs[i]] != null){
                  
                sendTo(users[usersIDs[i]], { 
                   type: "updatezone",
                   id:zoneItemID, 
                   action: "enter" 
                 });  
               }
             }

    r.table('zones').get(zoneItemID).update(result, {returnChanges: true}).run(req.app._rdbConn, function(err, result2) {
      if(err) {
        return next(err);
      }

      res.json(result2);
    });
  });
}


 /*
 * Free place
 */

 function leaveZoneItem(req, res, next) {
  var zoneItemID = req.params.id;

  r.table('zones').get(zoneItemID).run(req.app._rdbConn, function(err, result) {
    if(err) {
      return next(err);
    }

    result.full--;

    for (var i = 0; i < usersIDs.length; i++){
               if(users[usersIDs[i]] != null){
                  
                sendTo(users[usersIDs[i]], { 
                   type: "updatezone",
                   id:zoneItemID, 
                   action: "leave" 
                 });  
               }
             }

    r.table('zones').get(zoneItemID).update(result, {returnChanges: true}).run(req.app._rdbConn, function(err, result2) {
      if(err) {
        return next(err);
      }

      res.json(result2);
    });
  });
}

/*
 * Delete a zone item.
 */
function deleteZoneItem(req, res, next) {
  var zoneItemID = req.params.id;

  r.table('zones').get(zoneItemID).delete().run(req.app._rdbConn, function(err, result) {
    if(err) {
      return next(err);
    }

    res.json({success: true});
  });
}

/*
 * Page-not-found middleware.
 */
function handle404(req, res, next) {
  res.status(404).end('not found');
}

/*
 * Generic error handling middleware.
 * Send back a 500 page and log the error to the console.
 */
function handleError(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({err: err.message});
}

/*
 * Store the db connection and start listening on a port.
 */
function startExpress(connection) {
  app._rdbConn = connection;
  //app.listen(process.env.PORT || config.express.port);
  //console.log('Listening on port ' + config.express.port);
}

/*
 * Connect to rethinkdb, create the needed tables/indexes and then start express.
 * Create tables/indexes then start express
 */
async.waterfall([
  function connect(callback) {
    r.connect(config.rethinkdb, callback);
  },
  function createDatabase(connection, callback) {
    //Create the database if needed.
    r.dbList().contains(config.rethinkdb.db).do(function(containsDb) {
      return r.branch(
        containsDb,
        {created: 0},
        r.dbCreate(config.rethinkdb.db)
      );
    }).run(connection, function(err) {
      callback(err, connection);
    });
  },
  function createTable(connection, callback) {
    //Create the table if needed.
    r.tableList().contains('zones').do(function(containsTable) {
      return r.branch(
        containsTable,
        {created: 0},
        r.tableCreate('zones')
      );
    }).run(connection, function(err) {
      callback(err, connection);
    });
  },
  function createIndex(connection, callback) {
    //Create the index if needed.
    r.table('zones').indexList().contains('createdAt').do(function(hasIndex) {
      return r.branch(
        hasIndex,
        {created: 0},
        r.table('zones').indexCreate('createdAt')
      );
    }).run(connection, function(err) {
      callback(err, connection);
    });
  },
  function waitForIndex(connection, callback) {
    //Wait for the index to be ready.
    r.table('zones').indexWait('createdAt').run(connection, function(err, result) {
      callback(err, connection);
    });
  }
], function(err, connection) {
  if(err) {
    console.error(err);
    process.exit(1);
    return;
  }

  startExpress(connection);
});