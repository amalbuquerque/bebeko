var cool = require('cool-ascii-faces');
var mongoose = require('mongoose');
var models = require('./models/Slideshow')
var express = require('express');

var app = express();

/**
 * Connect to MongoDB.
 **/
mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    process.exit(1);
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

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/cool', function(request, response) {
    var result = '';
    var times = process.env.TIMES || 5;
    for (var i = 0; i < times; i++) {
        result += cool() + "<br />";
    }
    response.send(result);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


