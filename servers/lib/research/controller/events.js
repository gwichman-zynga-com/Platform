
var _         = require('lodash');
var when      = require('when');
var moment    = require('moment');
var csv       = require('csv');
var Util      = require('../../core/util.js');

module.exports = {
    getEventsByDate: getEventsByDate,
    _archiveEventsByDate: archiveEventsByDate
};

/*
 http://localhost:8090/research/events/get?gameId=AA-1&startDate=2014-05-01

 http://stage.argubotacademy.org:8090/research/events/get?gameId=AA-1&startDate=2014-05-01

 http://localhost:8090/research/events/get?gameId=AA-1&startDate=2014-05-01&endDate=2014-05-14&timeFormat="MM/DD/YYYY HH:mm:ss"


 required:
    gameId

 optional
    startDate
    endDate
    userIds
    saveToFile

    startEpoc
    dateRange
 */

// access data from a particular time period on the parser.  Write data to a csv (ultimately s3 bucket)
// adapted from getEventsByDate, needs to further be integrated with s3, and have new limit logic


function archiveEventsByDate(gameId, maxEvents){
    return when.promise(function(resolve, reject){
        var limit = maxEvents;

        var startDateTime;
        var endDateTime;
        var todayDate;
        var thisDate;
        var formattedDate;

        var part = 1;
        var parsedSchemaData;
        var fileString = __dirname
            + '/../../../../../../Desktop/'
            + gameId
            + "_" + formattedDate;
        var file = fileString + "_part" + part + ".csv";
        var existingFile = false;

        //
        function recursor(){
            return when.promise(function(resolve, reject){
                _archiveEventsByLimit.call(this, gameId, limit, startDateTime, endDateTime, file, parsedSchemaData, existingFile)
                    .then(function(outputs){
                        limit = outputs[0];
                        startDateTime = outputs[1];
                        if(startDateTime !== endDateTime) {
                            existingFile = true;
                            if (limit === 0) {
                                part++;
                                file = fileString + "_part" + part + ".csv";
                                limit = maxEvents;
                                existingFile = false;
                            }
                            recursor.call(this)
                                .then(function (state) {
                                    resolve(state)
                                }.bind(this))
                                .catch(function (err) {
                                    reject(err);
                                }.bind(this));
                        } else {
                            if (thisDate === todayDate) {
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        }
                    }.bind(this));
            }.bind(this));
        }

        // call to get start date
        //var archiveInfo;
        //var archiveKey = 'gd:archiveInfo';
        //this.store.client.get(archiveKey, function(err, results){
        //    if(err){
        //        return reject(err);
        //    }
        //    archiveInfo = results[gameId]
        //    date = archiveInfo.lastArchive.date;
        //    return date;
        //}.bind(this))
        //.then(function(date) {
        //    if(date !== todayDate){
        //        return recursor();
        //    }
        //    when.reject('up to date');
        //}.bind(this))
        //.then(function(state){
        //    archiveInfo.lastArchive.date = date + '1 day';
        //    this.store.client.set(archiveInfo, function(err, results){
        //        if(err){
        //            when.reject(err);
        //        }
        //        resolve(state);
        //    }.bind(this));
        //}.bind(this))
        //.catch(function(err){
        //    if(err === 'up to date'){
        //        resolve(true);
        //    }
        //    reject(err);
        //}.bind(this));
        var archiveInfo;
        var archiveKey = 'gd:archiveInfo';

        this.store.client.get(archiveKey, function(err, results){
            if(err){
                return reject(err);
            }
            archiveInfo = results[gameId]
            date = archiveInfo.lastArchive.date;
            return date;
        }.bind(this))
        .then(function(date){
            // date format is date object, "yyyy-mm-ddThh-MM-ss-SSSZ"
            //    2014-12-03T02:00:07.758Z"
            var dates = initDates(date);
            var startDateTime = dates[0];
            var endDateTime = dates[1];
            var todayDate = dates[2];
            var thisDate = dates[3];
            var formattedDate = dates[4];

            return this.store.getCsvDataByGameId(gameId);
        }.bind(this))
        .then(function (csvData) {
           return parseCSVSchema(csvData);
        }.bind(this))
        .then(function (_parsedSchemaData) {
            parsedSchemaData = _parsedSchemaData;
            return recursor.call(this)
        }.bind(this))
        .then(function(state){
            var archiveDate = archiveInfo.lastArchive.date.getDate();
            archiveInfo.lastArchive.date.setDate(archiveDate+1);

            this.store.client.set(archiveInfo, function(err, results){
                if(err){
                    when.reject(err);
                }
                resolve(state);
            }.bind(this));
        }.bind(this))
        .catch(function(err){
            console.log('Archive Events By Date Error - ',err);
            reject(err);
        }.bind(this));

    }.bind(this));
}


function _archiveEventsByLimit(gameId, limit, startDateTime, endDateTime, file, parsedSchemaData, existingFile){
    return when.promise(function(resolve, reject) {
        try {
            var timeFormat = "MM/DD/YYYY HH:mm:ss";
            var eventsLeft = limit;
            var updatedDateTime = startDateTime;

            this.store.getEventsByGameIdDate(gameId, startDateTime.toArray(), endDateTime.toArray(), limit)
                .then(function (events) {
                    console.log("Running Filter...");
                    //console.log("Processing", events.length, "Events...");
                    eventsLeft -= events.length;
                    console.log('initialLen:', events.length);
                    if(eventsLeft === 0){
                        var lastEventTime = events[events.length-1].serverTimeStamp;
                        var lastSecond = Math.floor(lastEventTime/1000)*1000;
                        var date = new Date(lastEventTime);

                        var seconds = date.getSeconds()-1;
                        var minute = date.getMinutes();
                        var hour = date.getHours();
                        var milliseconds = 999;

                        if(seconds === -1){
                            minute--;
                            seconds = 59;
                            if(minute === -1){
                                minute = 59;
                                hour--;
                            }
                        }

                        if(events[0].serverTimeStamp !== lastEventTime) {
                            while (lastEventTime >= lastSecond) {
                                events.pop();
                                lastEventTime = events[events.length - 1].serverTimeStamp;
                            }
                            console.log('updated len:', events.length);
                        } else{
                            seconds++;
                            if(seconds === 60){
                                seconds = 0;
                                minute++;
                                if(minute === 60){
                                    minute = 0;
                                    hour++;
                                    if(hour === 24){
                                        updatedDateTime = endDateTime;
                                        return;
                                    }
                                }
                            }
                        }
                        // compensates for time zone conversion from pst to utc in moment.  GMT-0800 (PST)
                        if(hour + 8 <= 24){
                            hour += 8;
                        } else{
                            hour = 8 - (24 - hour);
                        }
                        updatedDateTime.hour(hour);
                        updatedDateTime.minute(minute);
                        updatedDateTime.seconds(seconds);
                        updatedDateTime.milliseconds(milliseconds);
                        updatedDateTime = updatedDateTime.utc();
                    } else{
                        updatedDateTime = endDateTime;
                    }
                    // process events
                    return processEvents.call(this, parsedSchemaData, events, timeFormat, existingFile);
                }.bind(this))
                .then(function (outList) {
                    var outData = outList.join("\n");
                    return Util.WriteToCSV(outData, file);
                }.bind(this))
                .then(function(){
                    resolve([eventsLeft, updatedDateTime]);
                }.bind(this))
                // catch all
                .then(null, function (err) {
                    reject(err);
                    console.trace("Research: Process Events -", err);
                }.bind(this));

        } catch (err) {
            reject(err);
            console.error("Research: Get User Data Error -", err);
        }
    }.bind(this));
}

function initDates(date){
    var startDateTime = moment(date);
    startDateTime.hour(0);
    startDateTime.minute(0);
    startDateTime.seconds(0);
    startDateTime = startDateTime.utc();

    var endDateTime = moment(date);
    endDateTime.hour(23);
    endDateTime.minute(59);
    endDateTime.seconds(59);
    endDateTime = endDateTime.utc();

    var todayDate = new Date();
    todayDate = todayDate.setHours(0,0,0,0);

    var thisDate =  new Date(date);
    thisDate = thisDate.setHours(0,0,0,0);

    var formattedDate = startDateTime.format("YYYY-DD-MM");

    return [startDateTime, endDateTime, todayDate, thisDate, formattedDate];
}

function getEventsByDate(req, res, next){

    try {
        // set timeout so request doesn't close connection
        req.connection.setTimeout(this.options.request.httpTimeout);

        if( req.session &&
        req.session.passport) {
            var userData = req.session.passport.user;
            // check user permission
            if (!userData.permits.nav.parser) {
                this.requestUtil.errorResponse(res, {key: "user.permit.invalid"});
                return;
            }
        }

        if(!req.query) {
            this.requestUtil.errorResponse(res, {error: "missing arguments"}, 401);
            return;
        }

        if( !( req.params &&
            req.params.hasOwnProperty("gameId") ) ) {
            this.requestUtil.errorResponse(res, {error: "missing game id"});
            return;
        }
        var gameId = req.params.gameId;
        // gameId are not case sensitive
        gameId = gameId.toUpperCase();

        var parsedSchemaData = { header: "", rows: {} };
        // if no schema assume it's gameId
        var schema = gameId;
        if(req.query.schema) {
            schema = req.query.schema;
        }

        var startDate = moment({hour: 0});
        // startDate or startEpoc optional
        if(req.query.startEpoc) {
            startDate = parseInt(req.query.startEpoc)*1000;
        }
        if(req.query.startDate) {
            startDate = req.query.startDate;
            // if starts with " then strip "s
            if(startDate.charAt(0) == '"') {
                startDate = startDate.substring(1, startDate.length-1);
            }
        }
        if(!startDate) {
            this.requestUtil.errorResponse(res, {error: "missing startDate or startEpoc missing"}, 401);
            return;
        }
        startDate = moment(startDate);
        if( req.query.startDateHour ) {
            var startDateHour = req.query.startDateHour;
            startDate.hour( startDateHour );
        }
        else {
            startDate.hour(0);
        }
        if( req.query.startDateMin ) {
            var startDateMin = req.query.startDateMin;
            startDate.minute( startDateMin );
        }
        else {
            startDate.minute(0);
        }
        if( req.query.startDateSec ) {
            var startDateSec = req.query.startDateSec;
            startDate.seconds( startDateSec );
        }
        else {
            startDate.seconds(0);
        }
        startDate = startDate.utc();

        var endDate = moment();
        if(req.query.dateRange) {

            try {
                endDate = JSON.parse(req.query.dateRange);
                endDate = moment(startDate).add(endDate);
            } catch(err) {
                // error is ok, just ignore dateRange
                console.error("dateRange err:", err);
            }
        }
        if(req.query.endDate) {
            endDate = req.query.endDate;
            // if starts with " then strip "s
            if(endDate.charAt(0) == '"') {
                endDate = endDate.substring(1, endDate.length-1);
            }
            endDate = moment(endDate);
        }
        if( req.query.endDateHour ) {
            var endDateHour = req.query.endDateHour;
            endDate.hour( endDateHour );
        }
        else {
            endDate.hour(23);
        }
        if( req.query.endDateMin ) {
            var endDateMin = req.query.endDateMin;
            endDate.minute( endDateMin );
        }
        else {
            endDate.minute(59);
        }
        if( req.query.endDateSec ) {
            var endDateSec = req.query.endDateSec;
            endDate.seconds( endDateSec );
        }
        else {
            endDate.seconds(59);
        }
        //endDate.hour(23);
        //endDate.minute(59);
        //endDate.seconds(59);
        endDate = endDate.utc();


        var timeFormat = "MM/DD/YYYY HH:mm:ss";
        if(req.query.timeFormat) {
            timeFormat = req.query.timeFormat;
        }

        var limit;
        if(req.query.limit) {
            limit = req.query.limit;
        }

        var saveToFile = false;
        if(req.query.saveToFile) {
            saveToFile = (req.query.saveToFile === "true" ? true : false);
        }

        this.store.getCsvDataByGameId(gameId)
            .then(function(csvData){
                return parseCSVSchema(csvData);
            }.bind(this))

            .then(function(_parsedSchemaData){
                parsedSchemaData = _parsedSchemaData;

                console.log("Getting Events For Game:", gameId, "from", startDate.format("MM/DD/YYYY"), "to", endDate.format("MM/DD/YYYY"));
                return this.store.getEventsByGameIdDate(gameId, startDate.toArray(), endDate.toArray(), limit)
            }.bind(this))

            .then(function(events){

                try {
                    console.log("Running Filter...");
                    console.log("Processing", events.length, "Events...");

                    // process events
                    var p = processEvents.call(this, parsedSchemaData, events, timeFormat);
                    p.then(function(outList) {
                        var outData = outList.join("\n");

                        if(saveToFile) {
                            var file = gameId
                                +"_"+startDate.format("YYYY-DD-MM")
                                +"_"+endDate.format("YYYY-DD-MM")
                                +".csv";
                            this.requestUtil.downloadResponse(res, outData, file, 'text/csv');

                            /*
                            this.requestUtil.jsonResponse(res, {
                                numEvents: outList.length - 1, // minus header
                                data: outData
                            });
                            */
                        } else {
                            this.requestUtil.jsonResponse(res, {
                                numEvents: outList.length - 1, // minus header
                                data: outData
                            });
                        }
                    }.bind(this));

                } catch(err) {
                    console.trace("Research: Process Events -", err);
                    this.requestUtil.errorResponse(res, {error: err});
                }

            }.bind(this))

            // catch all
            .then(null, function(err){
                this.requestUtil.errorResponse(res, err);
            }.bind(this));

    } catch(err) {
        console.trace("Research: Get User Data Error -", err);
        this.requestUtil.errorResponse(res, {error: err});
    }
}

function parseCSVSchema(csvData) {
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------
    var parsedSchemaData = { header: "", rows: {} };
    //console.log('csvzz:', csvData, 'endzz');
    try {
        csv()
        .from(csvData, { delimiter: ',', escape: '"' })
        .on('record', function(row, index){

            // header
            if(index == 0) {
                row.shift(); // remove first column
                parsedSchemaData.header = csv().stringifier.stringify(row);
            } else {
                var key = row.shift(); // remove first (key) column
                parsedSchemaData.rows[ key ] = row;
            }

            //console.log('#'+index+' '+JSON.stringify(row));
        }.bind(this))
        .on('end', function(){
            resolve(parsedSchemaData);
        }.bind(this))
        .on('error', function(err){
            reject(err);
        }.bind(this));

    } catch(err) {
        console.trace("Research: Parse CSV Schema Error -", err);
        var res = res || false;
        if(res){
            this.requestUtil.errorResponse(res, {error: err});
        }
    }

// ------------------------------------------------
}.bind(this));
// end promise wrapper
}


function processEvents(parsedSchema, events, timeFormat, existingFile) {
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------

    //console.log("events:", events);
    //console.log("Parsed Schema for", schema, ":", parsedSchema);

    var outIt = 0;
    var outList = [];
    existingFile = existingFile || false;

    gameSessionIdList = _.pluck(events, "gameSessionId");
    this.store.getUserDataBySessions(gameSessionIdList)
        .then(function(userDataList){

            var timeDiff = 0;
            events.forEach(function(event, i) {

                try {
                    var startTime = moment();
                    var row = [];
                    if( i != 0 &&
                        i % this.options.research.dataChunkSize == 0)
                    {
                        var avgTimeDiff = timeDiff/i;
                        console.log("Processed Events:", i, ", Avg Time:", avgTimeDiff.toFixed(3));
                    }

                    if( !event.userId &&
                        event.gameSessionId &&
                        userDataList[event.gameSessionId] &&
                        userDataList[event.gameSessionId].userId
                      ) {
                        // add user Id to event
                        event.userId = userDataList[event.gameSessionId].userId;
                    }

                    // event name exists in parse map
                    if( parsedSchema.rows.hasOwnProperty(event.eventName) ) {
                        row = _.clone(parsedSchema.rows[ event.eventName ]);
                    }
                    // wildcard to catch all other event types
                    else if( parsedSchema.rows.hasOwnProperty('*') ) {
                        row = _.clone(parsedSchema.rows['*']);
                    } else {
                        //console.log("Process Event - Event Name not in List:", event.eventName);
                    }

                    if(timeFormat) {
                        // convert timestamp if not in milliseconds
                        var ct = event.clientTimeStamp;
                        var st = event.serverTimeStamp;
                        if(ct < 10000000000) ct *= 1000;
                        if(st < 10000000000) st *= 1000;

                        // need to convert EPOC to milliseconds
                        event.clientTimeStamp = moment(ct).format(timeFormat);
                        event.serverTimeStamp = moment(st).format(timeFormat);
                    }

                    if(row.length > 0) {
                        // check each row item
                        for(var r in row) {
                            if(row[r] == '*') {
                                row[r] = JSON.stringify(event);
                            } else {
                                row[r] = parseItems(event, row[r], '{', '}');
                                row[r] = parseItems(event.eventData, row[r], '[', ']');
                            }
                        }

                        outList[outIt] = csv().stringifier.stringify(row);
                        outIt++;
                    }

                    timeDiff += moment().diff(startTime);
                } catch(err) {
                    console.trace("Research: Process Events Error -", err);
                    reject(err);
                }
            }.bind(this));

        }.bind(this))
        .then(function(){
            console.log("Done Processing", events.length, "Events -> Out Events", outList.length);

            // add header
            if(!existingFile){
                outList.unshift(parsedSchema.header);
            }
            resolve(outList);
        }.bind(this));

// ------------------------------------------------
}.bind(this));
// end promise wrapper
}

function parseItems(event, row, left, right){
    var re = new RegExp("\\"+left+"(.*?)\\"+right, 'g');
    var matchs = getMatches(row, re, 1);

    var item = "", key = "";
    for(var m in matchs) {
        key = left + matchs[m] + right;
        item = processSpecialRowItem(matchs[m], event);

        var reReplace = new RegExp(escapeRegExp(key), 'g');
        row = row.replace(reReplace, item);
    }

    return row;
}

function processSpecialRowItem (item, data) {
    var results = "";
    with(data){
        try {
            results = eval(item);
        }
        catch(err) {
            // this is ok
        }
    }

    if(_.isObject(results)) {
        results = JSON.stringify(results);
    }

    return results;
}


function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function getMatches(string, regex, index) {
    index = index || 1; // default to the first capturing group
    var matches = [];
    var match;
    while (match = regex.exec(string)) {
        matches.push(match[index]);
    }
    return matches;
}