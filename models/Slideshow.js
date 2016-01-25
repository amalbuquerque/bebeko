var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

        var slideshowSchema = new Schema({
            name:       { type: String },
            token:      { type: String },
            // hash returned by DB API /metadata when obtaining folder metadata,
            // useful to quickly compare if content changed
            hash:       { type: String },
            // timestamp set to the expiry date of the slideshow photos
            // (stream DB links obtained with DB API /media expire after
            // 4 hours of being created)
            photos: [{
                key: String,
                url: String
             }],
            expirydate: { type: Date, default: Date.now },
        });

        module.exports = {
            Slideshow: mongoose.model('Slideshow', slideshowSchema)
        };
