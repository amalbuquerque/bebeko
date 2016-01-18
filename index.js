var mongoose = require('mongoose');
var models = require('./models/Slideshow');
var routes = require('./routes/route');
var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var app = express();
app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET || 'not_secret_at_all',
                  saveUninitialized: true,
                  resave: true }));

/**
 * Connect to MongoDB.
 **/
mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    // process.exit(1);
});

mongoose.connection.on('open', function() {
    console.log('Connected to Mongolab MongoDB via Mongoose...');

    // var hardcoded = new models.Slideshow({ name: 'third', 'token': 'abcxyz' });
    // console.log(hardcoded);
    // hardcoded.save(function(err, hc) {
    //     if (err) return console.error(err);
    //     console.log('hardcoded saved OK');
    // });

    models.Slideshow.find(function(err, slideshows) {
        if (err) return console.error(err);
        console.log(slideshows);
    });
});

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// 2016-01-17, AA: Using routes/route.js (routes separated)
app.use('/', routes);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


