var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

        var slideshowSchema = new Schema({
            name:      { type: String  },
            token:      { type: String  }
        });

        module.exports = {
            Slideshow: mongoose.model('Slideshow', slideshowSchema)
        };
