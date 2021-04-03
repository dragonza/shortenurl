'use strict'

var express = require('express')
var mongo = require('mongodb')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
const dns = require('dns')
const dotenv = require('dotenv')
dotenv.config()

const cors = require('cors')

const app = express()

// Basic Configuration
const port = process.env.PORT || 3000
const shortenedUrls = {}
/** this project needs a db !! **/
const urlencodedParser = bodyParser.urlencoded({extended: false})

const urlSchema = new mongoose.Schema({
    original_url: {type: String, required: true},
    short_url: {type: String},
})

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
    // we're connected!
    console.log('connected')
})

const UrlModel = mongoose.model('Url', urlSchema)

app.use(cors())
app.use(urlencodedParser)
/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'))

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html')
})

// your first API endpoint...
app.get('/api/hello', function (req, res) {
    res.json({greeting: 'hello API'})
})

app.post('/api/shorturl/new', function (req, res) {
    const regex = /^(http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/g
    const url = req.body.url
    if (!regex.test(url)) {
        res.status(401)
        return res.send({error: 'invalid url'})
    }

    UrlModel.findOne({original_url: url}, (err, doc) => {
        if (doc) {
            res.send({
                original_url: url,
                short_url: doc.short_url,
            })
        } else {
            dns.lookup(url.split('//')[1], function (err, address, family) {
                console.log('family', family)
                if (!family || err) {
                    res.status(401)
                    res.send({error: 'Invalid hostname'})
                } else {
                    UrlModel.estimatedDocumentCount((err, count) => {
                        if (err) {
                            res.send('Something is wrong at counting the url. Please try again!')
                        }
                        const newUrl = new UrlModel({
                            original_url: url,
                            short_url: count + 1,
                        })

                        newUrl.save((err, savedDoc) => {
                            if (err) {
                                res.send('Something is wrong at saving the url. Please try again!')
                            }
                            res.send({
                                original_url: savedDoc.original_url,
                                short_url: savedDoc.short_url,
                            })
                        })
                    })
                }
            })
        }
    })
})

app.get('/api/shorturl/:id', (req, res) => {
    const id = req.params.id
    UrlModel.findOne({short_url: id}, (err, doc) => {
        if (!doc) {
            return res.send({error: 'invalid url'})
        }
        res.redirect(doc.original_url)
    })
})

app.listen(port, function () {
    console.log('Node.js listening to', port)
})
