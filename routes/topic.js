'use strict'

var express = require('express');
var TopicController = require('../controllers/topic');

var router = express.Router();
var md_auth = require('../middlewares/authenticated');

router.get('/test', TopicController.test);
router.post('/topic', md_auth.authenticated, TopicController.save);
router.get('/topics/:page?', TopicController.getTopics); //Paremtro page es la pagina en la que esta el topic
router.get('/user-topics/:user', TopicController.getTopicsByUser);
router.get('/topic/:id', TopicController.getTopic);
router.get('/search/:search', TopicController.search);
router.put('/topic/:id', md_auth.authenticated, TopicController.update);
router.delete('/topic/:id', md_auth.authenticated, TopicController.delete);

module.exports = router;