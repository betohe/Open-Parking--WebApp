'use strict';

import {Router} from 'express';
import * as controller from './chat.controller';

var router = new Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/userowned/:uid', controller.userowned);
router.get('/userbeen/:uid', controller.userbeen);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

export default router;
