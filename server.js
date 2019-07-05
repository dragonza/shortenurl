'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser')
const dns = require('dns');

var cors = require('cors');

var app = express();

let index = 1;
// Basic Configuration
var port = process.env.PORT || 3000;
const shortenedUrls = {

}
/** this project needs a db !! **/
// mongoose.connect(process.env.MONGOLAB_URI);
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(cors());
app.use(urlencodedParser)
/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", function (req, res) {

  const regex = /^(http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/g
  if (!regex.test(req.body.url)) {
    res.send({"error":"invalid URL"})
  }

  if ((Object.values(shortenedUrls).map(obj => obj.original_url)).includes(req.body.url)) {

    res.send({
      "original_url": req.body.url,
      "short_url": index - 1
    })
  } else {

    dns.lookup(req.body.url.split('//')[1], function (err, address, family) {
      if (family) {
        res.send({
          "original_url": req.body.url,
          "short_url": index
        })
        shortenedUrls[index] = {
          original_url: req.body.url,
          short_url: index
        }
        index++;
      }
    })
  }


})

app.get("/api/shorturl/:id", (req, res) => {
  const id = req.params.id
  const isIdExisted = Object.keys(shortenedUrls).includes(id)
  if (isIdExisted) {
    res.redirect(shortenedUrls[id].original_url)
  } else {
    res.send({"error":"invalid URL"})
  }
})



app.listen(port, function () {
  console.log('Node.js listening ...');
});
