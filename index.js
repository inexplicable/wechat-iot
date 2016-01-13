'use strict';

var request = require('request');
var express = require('express');
var crypto = require('crypto');
var _ = require('lodash');
var bodyParser = require('body-parser')
var parseXml = require('xml2js').parseString;

var appId = 'wx745009b2b31b5969';

request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appId + '&secret=d4624c36b6795d1d99dcf0547af5443d', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var accessToken = JSON.parse(body).access_token;

    request('https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token=' + accessToken, function(error, response, body){
      if (!error && response.statusCode == 200) {
        var jsapiTicket = JSON.parse(body).ticket;
        console.log('[wechat] appId:%s got jsapiTicket:%s at:%s', appId, jsapiTicket, Date.now());

        //expressjs configuration
        var app = express();

        app.use(bodyParser.text({ type: 'text/*' }));
        app.set('views', './views');
        app.set('view engine', 'jade');

        //expressjs routes
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
          var hashing = 'jsapi_ticket=' + jsapiTicket + '&noncestr=' + noncestr + '&timestamp=' + now + '&url=http://ec2-54-213-251-18.us-west-2.compute.amazonaws.com/hello';
          var sha1 = crypto.createHash('sha1');
          var signature = sha1.update(hashing, 'ascii').digest('hex');

          res.type('html').render('hello', {
            appId         : appId,
            noncestr      : noncestr,
            timestamp     : now,
            jsapi_ticket  : jsapiTicket,
            signature     : signature
          });
        });

        var server = app.listen(80, function () {
          var host = server.address().address;
          var port = server.address().port;

          console.log('wechat iot app listening at http://%s:%s', host, port);
        });
      }
    });
  }
});
