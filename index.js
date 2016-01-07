'use strict';

var express = require('express');
var crypto = require('crypto');
var _ = require('lodash');

//routes
var app = express();

app.get('/', function(req, res) {

  var signature = req.query.signature;
  var timestamp = req.query.timestamp;
  var nonce = req.query.nonce;
  var echostr = req.query.echostr;

  console.log('[timestamp:%s, nonce:%s, echostr:%s, signature:%s]', timestamp, nonce, echostr, signature);

  var sha1 = crypto.createHash('sha1');
  var expects = sha1.update(_.sortBy([timestamp, nonce, echostr]).join('')).digest('hex');

  console.log('[signature:%s vs. expects:%s]', signature, expects);

  if(_.isEqual(signature, expects)){
    res.send(echostr);
  }
  else{
    res.status(400).send('signature denied');
  }
});

var server = app.listen(80, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('wechat iot app listening at http://%s:%s', host, port);
});
