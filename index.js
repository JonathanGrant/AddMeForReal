var express = require('express');
var app = express();
var https = require('https');
var FormData = require('form-data');
var util = require('util');
var https = require('https');
var request = require("request");
var path = require('path');
var bodyParser = require('body-parser');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

/******************GET USERID*************/

app.post('authorize.html', function(request, response){

  console.log(response);
});

/*****************************************/

app.get('/oauth/ig', function (req, res) {
  var form = new FormData();
  form.append('client_id',process.env.IG_CLIENT)
  form.append('client_secret',process.env.IG_SECRET)
  form.append('grant_type','authorization_code')
  form.append('redirect_uri','http://localhost:1992/oauth/ig')
  form.append('code',req.query.code)
  form.submit({hostname: "api.instagram.com", path: "/oauth/access_token", protocol: 'https:'}, (error, response) => {
    var body = "";
    response.on('readable', function() {
        body += response.read();
    });
    response.on('end', function() {
      console.log(body);
      var jsonBody = JSON.parse(body);
      if("user" in jsonBody) {
        var requestData = {
          "operation": "update",
          "tableName": "AddMeUsers",
          "payload": {
            "Key": {
                "userid": "6507993840"
            },
            "UpdateExpression": "set igid = :id, ig_access = :ac",
            "ExpressionAttributeValues": {
              ":id": jsonBody.user.id,
              ":ac": jsonBody.access_token
            }
          }
        }
        request({
            url: "https://rdsmefueg6.execute-api.us-east-1.amazonaws.com/prod",
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
                "x-api-key": process.env.API_KEY,
            },
            body: requestData
          }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
              console.log("200: ", body)
            }
            else {
              console.log("error: " + error)
              console.log("response.statusCode: " + response.statusCode)
              console.log("response.statusText: " + response.statusText)
            }
            res.send(body);
          });
      } else {
        res.send(body);
      }
    });
  });
})

app.post('/ig/follow', function(req, res) {
    console.log(req.query.friend_id);
    var theAccess = req.query.access_token;
    var form = new FormData();
    form.append('access_token', theAccess);
    form.append('action', 'follow');
    form.submit({hostname: "api.instagram.com", path: `/v1/users/${req.query.friend_id}/relationship?access_token=${theAccess}`, protocol: 'https:'}, (error, response) => {
      var body = "";
      response.on('readable', function() {
          body += response.read();
      });
      response.on('end', function() {
          console.log(body);
          res.send(body);
      });
    });
});


app.get('/oauth/fb', function (req, res) {
    https.get('https://graph.facebook.com/v2.3/oauth/access_token?client_id=134558940334255&redirect_uri=http://localhost:1992/oauth/fb&client_secret=e485181d992009910034bbda611eda66&code=' + req.query.code, (response) => {

	    console.log(req.query.code);

	    var body = "";
	    response.on('readable', function() {
	        body += response.read();
	    });
	    response.on('end', function() {
	        console.log(body);
	        res.send(body);
	    });

  	});
})

app.get('/oauth/gh', function (req, res) {

    https.get('https://github.com/login/oauth/access_token?client_id=89221658f77bf282f490&client_secret=11f6d9c96c884834e4d3c4cfc0b8cd5c32231c52&code=' + req.query.code + '&redirect_uri=http://localhost:1992/oauth/gh', (response) => {

	    console.log(req.query.code);

	    var body = "";
	    response.on('readable', function() {
	        body += response.read();
	    });
	    response.on('end', function() {
        console.log(body);
        var accessToken = body.split("access_token=")[1].split("&")[0];
        console.log(accessToken)
        request({
            url: "https://api.github.com/user?access_token="+accessToken,
            method: "GET",
            json: true,
            headers: {
                "User-Agent": "AddMe"
            },
            body: {}
          }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
              console.log("200: ", body)
              if ("login" in body) {
               var requestData = {
                  "operation": "update",
                  "tableName": "AddMeUsers",
                  "payload": {
                    "Key": {
                        "userid": "6507993840"
                    },
                    "UpdateExpression": "set ghid = :id, gh_access = :ac",
                    "ExpressionAttributeValues": {
                      ":id": body.login,
                      ":ac": accessToken
                    }
                  }
                }
                request({
                    url: "https://rdsmefueg6.execute-api.us-east-1.amazonaws.com/prod",
                    method: "POST",
                    json: true,
                    headers: {
                        "content-type": "application/json",
                        "x-api-key": process.env.API_KEY,
                    },
                    body: requestData
                  }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                      console.log("200: ", body)
                    }
                    else {
                      console.log("error: " + error)
                      console.log("response.statusCode: " + response.statusCode)
                      console.log("response.statusText: " + response.statusText)
                    }
                    res.send(body);
                  });
              } else {
                res.send(body);
              }
            }
            else {
              console.log("error: " + error)
              console.log("response.statusCode: " + response.statusCode)
              console.log("response.statusText: " + response.statusText)
              res.send(body);
            }
          });
  	    });
  	});
})

app.post('/snapchat/save/:snapchat_id/', function(req, res) {
  console.log("Save Snapchat Id");
  // Get user calling function
  var snapchatId = req.params.snapchat_id
  // Save to AWS
  var requestData = {
    "operation": "update",
    "tableName": "AddMeUsers",
    "payload": {
      "Key": {
          "userid": "6507993840"
      },
      "UpdateExpression": "set scid = :id",
      "ExpressionAttributeValues": {
        ":id": snapchatId
      }
    }
  }
  request({
      url: "https://rdsmefueg6.execute-api.us-east-1.amazonaws.com/prod",
      method: "POST",
      json: true,
      headers: {
          "content-type": "application/json",
          "x-api-key": process.env.API_KEY,
      },
      body: requestData
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log("200: ", body)
      }
      else {
        console.log("error: " + error)
        console.log("response.statusCode: " + response.statusCode)
        console.log("response.statusText: " + response.statusText)
      }
      res.send(body);
    });
});

app.post('/ig/follow', function(req, res) {
    console.log(req.query.friend_id);
    var theAccess = req.query.access_token;
    var form = new FormData();
    form.append('access_token', theAccess);
    form.append('action', 'follow');
    form.submit({hostname: "api.instagram.com", path: `/v1/users/${req.query.friend_id}/relationship?access_token=${theAccess}`, protocol: 'https:'}, (error, response) => {
      var body = "";
      response.on('readable', function() {
          body += response.read();
      });
      response.on('end', function() {
          console.log(body);
          res.send(body);
      });
    });
});

app.post('/gh/follow', function(req, res) {
    console.log(req.query.friend_id);
});

app.post('/:friend_id/addme', function(req, res) {
  console.log("Follow all called.");
  // Get user calling function
  var myId = req.query.my_id;
  // Get friend to follow
  var friendId = req.params.friend_id;
  // Get all social profiles attached to friend
  var myRequestData = {
      "operation": "read",
      "tableName": "AddMeUsers",
      "payload": {
        "Key": {
            "userid": myId
        }
      }
    }
  request({
      url: "https://rdsmefueg6.execute-api.us-east-1.amazonaws.com/prod",
      method: "POST",
      json: true,
      headers: {
          "content-type": "application/json",
          "x-api-key": process.env.API_KEY,
      },
      body: myRequestData
    }, function (error, response, myBody) {
      if (!error && response.statusCode === 200) {
        console.log("200: ", body)
        var friendRequestData = {
            "operation": "read",
            "tableName": "AddMeUsers",
            "payload": {
              "Key": {
                  "userid": friendId
              }
            }
          }
        request({
            url: "https://rdsmefueg6.execute-api.us-east-1.amazonaws.com/prod",
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
                "x-api-key": process.env.API_KEY,
            },
            body: friendRequestData
          }, function (error, response, friendBody) {
        // For each social profile, follow them if we can.
        if ("igid" in myBody && "igid" in friendBody) {
          var form = new FormData();
          form.append('access_token', myBody.ig_access);
          form.append('action', 'follow');
          form.submit({hostname: "api.instagram.com", path: `/v1/users/${friendBody.igid}/relationship?access_token=${myBody.ig_access}`, protocol: 'https:'}, (error, response) => {
            var body = "";
            response.on('readable', function() {
                body += response.read();
            });
            response.on('end', function() {
                console.log(body);
            });
          });
        }
        if ("ghid" in myBody && "ghid" in friendBody) {
          request({
              url: "https://api.github.com/user/following/"+friendBody.ghid+"?access_token="+myBody.gh_access,
              method: "PUT",
              json: true,
              headers: {
                "User-Agent": "AddMe"
              },
              body: {}
            }, function (error, response, body) {
              if (!error && response.statusCode === 200) {
                console.log("200: ", body)
              }
              else {
                console.log("error: " + error)
                console.log("response.statusCode: " + response.statusCode)
                console.log("response.statusText: " + response.statusText)
              }
              res.send(body);
            });
        }
        if ("scid" in myBody && "scid" in friendBody) {
          res.redirect("https://snapchat.com/add/"+friendBody.scid);
        }
      } else {
        console.log("error: " + error)
        console.log("response.statusCode: " + response.statusCode)
        console.log("response.statusText: " + response.statusText)
        res.send(body);
      }
    });
});

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/authorize.html'));
});

var server = app.listen(process.env.PORT || 1992, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port);

})
