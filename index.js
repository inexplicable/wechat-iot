'use strict';

var express = require('express');
var crypto = require('crypto');
var _ = require('lodash');
var bodyParser = require('body-parser')
var parseXml = require('xml2js').parseString;

//routes
var app = express();

app.use(bodyParser.text({ type: 'text/*' }));
app.set('views', './views');
app.set('view engine', 'jade');

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
        console.log('cannot handle:%s and %j', req.is('text/*'), req.body);
        res.status(500).send('fail');
    }
    else{
        console.log('processing:%j', parsed);

        res.type('xml').render('echo', {
          FromUserName: parsed.xml.ToUserName[0],
          ToUserName  : parsed.xml.FromUserName[0],
          CreateTime  : Date.now(),
          MsgType     : 'text',
          Content     : 'ECHO:' + parsed.xml.Content[0]
        });
    }
  });
});

var server = app.listen(80, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('wechat iot app listening at http://%s:%s', host, port);
});
