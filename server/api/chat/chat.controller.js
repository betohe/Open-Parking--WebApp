/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/chats              ->  index
 * POST    /api/chats              ->  create
 * GET     /api/chats/:id          ->  show
 * PUT     /api/chats/:id          ->  update
 * DELETE  /api/chats/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import Chat from './chat.model';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return function(entity) {
    var updated = _.merge(entity, updates);
    return updated.saveAsync()
      .spread(updated => {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.removeAsync()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Chats
export function index(req, res) {
  Chat.findAsync()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Get chats owned by the user

exports.userowned = function(req, res) {
  Chat.findAsync({ owner : req.params.uid })
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Get chats where the user has been

exports.userbeen = function(req, res) {
  Chat.findAsync()
    .where('participants').elemMatch(function (elem) {
      elem.where(req.params.uid, 'allowed')
    })
    .then(responseWithResult(res))
    .catch(handleError(res));
};


// Gets a single Chat from the DB
export function show(req, res) {
  Chat.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Chat in the DB
export function create(req, res) {
  Chat.createAsync(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Updates an existing Chat in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Chat.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Chat from the DB
export function destroy(req, res) {
  Chat.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
