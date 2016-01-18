var cache = {};

module.exports = {
    put: function(key, item) {
        // console.log('Saving ', item, ' with ', key);
        cache[key] = item;
    },
    get: function(key) {
        // console.log('Getting item with ', key);
        return cache[key];
    }
}
