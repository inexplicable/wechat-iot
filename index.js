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

  console.log('[timestamp:%s, nonce:%s, echostr:%s, signature:%s]', timestamp, nonce, echostr, signature);

  var sha1 = crypto.createHash('sha1');
  var expects = sha1.update(_.sortBy([timestamp, nonce, '1']).join(''), 'ascii').digest('hex');

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

        res.type('xml').render('news', {
          FromUserName: parsed.xml.ToUserName[0],
          ToUserName  : parsed.xml.FromUserName[0],
          CreateTime  : Date.now(),
          MsgType     : 'news',
          Articles    : [{
            Title       : 'title1',
            Description : 'description1',
            PicUrl      : 'http://mp.weixin.qq.com/debug/zh_CN/htmledition/images/bg/bg_logo1f2fc8.png',
            Url         : 'http://ec2-54-213-251-18.us-west-2.compute.amazonaws.com/hello'
          }]
        });
    }
  });
});

app.get('/hello', function(req, res){

  var noncestr = req.query.noncestr || Date.now();
  var now = Math.floor(Date.now() / 1000);
  var hashing = 'jsapi_ticket=sM4AOVdWfPE4DxkXGEs8VP4_63kSlZPZB4-NDJpwhSubeM_h7rZ3zSognVA5KOL0Lz0fatPvl3mSecccEj6vwg&noncestr=' + noncestr + '&timestamp=' + now + '&url=http://ec2-54-213-251-18.us-west-2.compute.amazonaws.com/hello';

  console.log('[html page] hashing:%s', hashing);

  var sha1 = crypto.createHash('sha1');
  //{"access_token":"dGZaEWWM5_GXK4PCOvcIBKbbbj8TVspo-ugRCgqKuO0B8NDXCV5GTcILMmSZbBCJFlH1JjBpcJq53wcCkc_wwu3fZMs2Gydi9jhDamHsiWUTVKcAGAJLA","expires_in":7200}
  //{"errcode":0,"errmsg":"ok","ticket":"sM4AOVdWfPE4DxkXGEs8VP4_63kSlZPZB4-NDJpwhSubeM_h7rZ3zSognVA5KOL0Lz0fatPvl3mSecccEj6vwg","expires_in":7200}
  //jsapi_ticket=sM4AOVdWfPE4DxkXGEs8VMCPGGVi4C3VM0P37wVUCFvkVAy_90u5h9nbSlYy3-Sl-HhTdfl2fzFy1AOcHKP7qg&noncestr=Wm3WZYTPz0wzccnW&timestamp=1414587457&url=http://mp.weixin.qq.com?params=value
  var signature = sha1.update(hashing, 'ascii').digest('hex');

  res.type('html').render('hello', {
    appId         : 'wx745009b2b31b5969',
    noncestr      : noncestr,
    timestamp     : now,
    jsapi_ticket  : 'sM4AOVdWfPE4DxkXGEs8VP4_63kSlZPZB4-NDJpwhSsmedBlC0zlg0Mk9A19GcvSkNdVZLDSTgOMHsCTOVm96w',
    signature     : signature
  });
});

var server = app.listen(80, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('wechat iot app listening at http://%s:%s', host, port);
});
