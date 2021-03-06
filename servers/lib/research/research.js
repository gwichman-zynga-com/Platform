/**
 * Research Module
 *
 *
 */
module.exports = {
    LongName: "Research",
    ServiceName: "research",
    Controller: {
        events: require('./controller/events.js'),
        csv: require('./controller/csv.js')
    },
    Service: require('./research.service.js'),
    Datastore: {
        Couchbase: require('./research.datastore.couchbase.js')
    }
};
