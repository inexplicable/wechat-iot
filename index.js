'use strict';

var express = require('express');
var crypto = require('crypto');
var _ = require('lodash');
var parseXml = require('xml2js').parseXml;

//routes
var app = express();

app.get('/', function(req, res) {

  var signature = req.query.signature;
  var timestamp = req.query.timestamp;
  var nonce = req.query.nonce;
  var echostr = req.query.echostr;

  console.log('[timestamp:%s, nonce:%s, echostr:%s, concat:%s, signature:%s]', timestamp, nonce, echostr, _.sortBy([timestamp, nonce, '1']).join(''), signature);

  var sha1 = crypto.createHash('sha1');
  var expects = sha1.update(_.sortBy([timestamp, nonce, '1']).join(''), 'utf8').digest('hex');

  console.log('[signature:%s vs. expects:%s]', signature, expects);

  if(_.isEqual(signature, expects)){
    res.send(echostr);
  }
  else{
    res.status(400).send('signature denied');
  }
});

app.post('/', function(req, res){

  parseXml(req.body, function(err, parsed){

    if(err){
        res.status(500).send('cannot handle:%s', req.body);
    }
    else{
        console.log('processing:%j', parsed);
        res.send('ok');
    }
  });
});

var server = app.listen(80, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('wechat iot app listening at http://%s:%s', host, port);
});
