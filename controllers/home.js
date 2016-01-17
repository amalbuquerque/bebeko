exports.index = function(req, res){
    res.render('pages/index');
};

exports.cool = function(request, response) {
    var cool = require('cool-ascii-faces');

    var result = '';
    var times = process.env.TIMES || 5;
    for (var i = 0; i < times; i++) {
        result += cool() + "<br />";
    }
    response.send(result);
};

exports.brua = function(req, res) {
    res.json({ 'foo' : 'bar' });
};
