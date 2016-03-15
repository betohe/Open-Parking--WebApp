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
    console.log("Zone updated: "+zone.id);
    socket.broadcast.emit('adminsupdatezone', {zone:zone});
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
 * Retrieve all todo items.
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
 * Insert a new todo item.
 */
function createZoneItem(req, res, next) {
  var todoItem = req.body;
  todoItem.createdAt = r.now();

  console.dir(todoItem);

  r.table('zones').insert(todoItem, {returnChanges: true}).run(req.app._rdbConn, function(err, result) {
    if(err) {
      return next(err);
    }

    res.json(result.changes[0].new_val);
  });
}

/*
 * Get a specific todo item.
 */
function getZoneItem(req, res, next) {
  var todoItemID = req.params.id;

  r.table('zones').get(todoItemID).run(req.app._rdbConn, function(err, result) {
    if(err) {
      return next(err);
    }

    res.json(result);
  });
}

/*
 * Update a todo item.
 */
function updateZoneItem(req, res, next) {
  var todoItem = req.body;
  var todoItemID = req.params.id;

  r.table('zones').get(todoItemID).update(todoItem, {returnChanges: true}).run(req.app._rdbConn, function(err, result) {
    if(err) {
      return next(err);
    }

    res.json(result.changes[0].new_val);
  });
}

/*
 * Delete a todo item.
 */
function deleteZoneItem(req, res, next) {
  var todoItemID = req.params.id;

  r.table('zones').get(todoItemID).delete().run(req.app._rdbConn, function(err, result) {
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
  app.listen(config.express.port);
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