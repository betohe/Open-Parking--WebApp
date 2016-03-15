var async = require('async');
var express = require('express');
var bodyParser = require('body-parser');
var sockio = require("socket.io");
var r = require('rethinkdb');

var config = require(__dirname + '/config.js');

var app = express();

var io = sockio.listen(app.listen(config.socketio.port), {log: false});

console.log("Server started on port " + config.socketio.port);

//For serving the index.html and all the other front-end assets.
app.use(express.static(__dirname + '/public'));

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


/*
 * Socket.io
 */

 io.sockets.on("connection", function(socket) {

  console.log('a user connected');
  socket.emit('welcome', { message: 'Welcome!', id: socket.id });

  socket.on("updatezone", function(zone){
    console.log("Zone updated: "+zone.id+", action: "+zone.action);
    socket.broadcast.emit('updatezone', zone);
  });

  socket.on("zonecreated", function(zone){
    console.log("Zone created: "+zone.id);
    socket.broadcast.emit('newzone', zone);
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

    io.sockets.emit('updatezone', {id:zoneItemID, action: "enter" });

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

    io.sockets.emit('updatezone', {id:zoneItemID, action: "leave" });

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
  app.listen(process.env.PORT || config.express.port);
  console.log('Listening on port ' + config.express.port);
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