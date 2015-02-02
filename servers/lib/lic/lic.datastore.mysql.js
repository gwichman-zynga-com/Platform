/**
 * License Module
 * Module dependencies:
 *  lodash - https://github.com/lodash/lodash
 *  when   - https://github.com/cujojs/when
 *
 */
// Third-party libs
var _      = require('lodash');
var moment = require('moment');
var when   = require('when');
var lConst = require('./lic.const.js');

// load at runtime
var MySQL;
var exampleOut = {};

module.exports = Lic_MySQL;

function Lic_MySQL(options){
    // Glasslab libs
    MySQL   = require('../core/datastore.mysql.js');

    this.options = _.merge(
        {
            host    : "localhost",
            user    : "glasslab",
            password: "glasslab",
            database: "glasslab_dev"
        },
        options
    );

    this.ds = new MySQL(this.options);
}

Lic_MySQL.prototype.connect = function(){
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------

    this.updateLicenseTable()
        .then(function(updated){
            if(updated) {
                console.log("Lic MySQL: Updated Course Table!");
                console.trace("change this!!!!!!!!!!!!!");
            }
            resolve();
        }.bind(this),
        function(err){
            reject(err);
        }.bind(this));

// ------------------------------------------------
}.bind(this));
// end promise wrapper
};

Lic_MySQL.prototype.getLicenseById = function(licenseId){
    return when.promise(function(resolve, reject){
        var Q = "SELECT * FROM GL_LICENSE WHERE id = " + licenseId + ";";
        this.ds.query(Q)
            .then(function(results){
                resolve(results);
            })
            .then(null, function(err){
                reject(err);
            });
    }.bind(this));
};

Lic_MySQL.prototype.getUsersByIds = function(ids){
    return when.promise(function(resolve, reject){
        var idsString = ids.join(',');
        var Q = "SELECT * FROM GL_USER WHERE id in (" + idsString + ");";
        this.ds.query(Q)
            .then(function(results){
                resolve(results);
            })
            .then(null, function(err){
                reject(err);
            });
    }.bind(this))
};

Lic_MySQL.prototype.getLicenseByInstructor = function(userId){
    return when.promise(function(resolve, reject){
        var Q = "SELECT * FROM GL_LICENSE_MAP WHERE status in ('active','pending') and user_id = " + userId + ";";
        this.ds.query(Q)
            .then(function(results){
                var output = [];
                results.forEach(function(row){
                    if(row["status"] === "active" || row["status"] === "pending"){
                        output.push(row);
                    }
                });
                resolve(output);
            }.bind(this))
            .then(null, function(err){
                reject(err);
            }.bind(this));
    }.bind(this));
};

Lic_MySQL.prototype.getInstructorsByLicense = function(licenseId){
    return when.promise(function(resolve, reject){
        var Q = "SELECT u.first_name,u.last_name,u.email,lm.status FROM GL_USER as u\n" +
            "JOIN GL_LICENSE_MAP as lm\n" +
            "ON lm.user_id = u.id\n" +
            "WHERE lm.license_id = " + licenseId + " and lm.status in ('active','pending');";
        this.ds.query(Q)
            .then(function(results){
                resolve(results);
            })
            .then(null, function(err){
                reject(err);
            })
    }.bind(this));
};

Lic_MySQL.prototype.getCoursesByInstructor = function(userId){
    return when.promise(function(resolve, reject){
        var Q = "SELECT course_id FROM GL_MEMBERSHIP WHERE user_id = " + userId + ";";
        this.ds.query(Q)
            .then(function(results){
                var output = [];
                var id;
                results.forEach(function(course){
                    id = course.id;
                    output.push(id);
                });
                resolve(output);
            })
            .then(null, function(err){
                reject(err);
            });
    }.bind(this));
};

Lic_MySQL.prototype.getCourseTeacherJoinByLicense = function(licenseId){
    return when.promise(function(resolve, reject){
        var Q = "SELECT m.course_id,m.user_id,teachers.username FROM glasslab_dev.GL_MEMBERSHIP as m\n" +
            "JOIN\n" +
            "(SELECT id,username FROM glasslab_dev.GL_USER as u\n" +
                "JOIN\n" +
                    "(SELECT user_id FROM glasslab_dev.GL_LICENSE_MAP WHERE license_id = " + licenseId + ") as lm\n" +
                    "ON lm.user_id = u.id\n" +
            ") as teachers\n" +
            "ON teachers.id = m.user_id;";

        this.ds.query(Q)
            .then(function(courses){
                var courseTeacherMap = {};
                var map;
                courses.forEach(function(course){
                    map = courseTeacherMap[course["courseId"]] = {};
                    map["userId"] = course["userId"];
                    map["username"] = course["username"];
                });
                resolve(courseTeacherMap);
            })
            .then(null, function(err){
                reject(err);
            });
    }.bind(this));
};

Lic_MySQL.prototype.getUsersByEmail = function(emails){
    return when.promise(function(resolve, reject){
        var emailsString = emails.join(',');
        var Q = "SELECT * FROM GL_USER WHERE email in (" + emailsString + ");";
        this.ds.query(Q)
            .then(function(results){
                resolve(results);
            })
            .then(null, function(err){
                reject(err);
            });
    }.bind(this));
};

Lic_MySQL.prototype.multiInsertTempUsersByEmail = function(emails){
    return when.promise(function(resolve, reject){
        var Q = "INSERT INTO glasslab_dev.GL_USER (email,username,version,date_created,enabled,first_name,last_name,last_updated," +
            "password,system_role,collect_telemetry,login_type) VALUES ";
        var values = [];
        emails.forEach(function(email){
            values.push(_insertUserValueWithEmail(email));
        });
        Q += values.join(",") + ";";
        this.ds.query(Q)
            .then(function(results){
                resolve(results);
            })
            .then(null, function(err){
                reject(err);
            });
    }.bind(this));
};

function _insertTempUserValueWithEmail(email){
    var value = "(" + email + "," + email + ",0,NOW(),1,'temp','temp',NOW()," +
    "'pass','instructor',0,'glasslabv2')";
    return value;
}

Lic_MySQL.prototype.multiInsertLicenseMap = function(licenseId, userIds){
    return when.promise(function(resolve, reject){
        var inputs = [];
        var startValues = "('pending'," + licenseId;
        userIds.forEach(function(id){
            inputs.push(startValues + id + ")")
        });
        var insertValues = inputs.join(',');

        var Q = "INSERT INTO GL_LICENSE_MAP (status,license_id,user_id) VALUES " + insertValues + ";";
        this.ds.query(Q)
            .then(function(results){
                resolve(results);
            }.bind(this))
            .then(null, function(err){
                reject(err);
            });
    }.bind(this));
};

Lic_MySQL.prototype.createLicenseTable = function() {
// add promise wrapper
    return when.promise(function(resolve, reject) {
// ------------------------------------------------

        var Q = "CREATE TABLE GL_LICENSE(\n" +
            "id BIGINT(20) NULL AUTO_INCREMENT,\n" +
            "user_id BIGINT(20) NULL,\n" +
            "license_key VARCHAR(20) NULL,\n" +
            "package_type VARCHAR(20) NULL,\n" +
            "package_size_tier VARCHAR(20) NULL,\n" +
            "expiration_date DATETIME,\n" +
            "active TINYINT(1),\n" +
            "educator_seats_remaining INT(10) NULL,\n" +
            "student_seats_remaining INT(10) NULL,\n" +
            "promo VARCHAR(20) NULL,\n" +
            "PRIMARY KEY (id),\n" +
            "INDEX fk_user_id_idx (user_id ASC),\n" +
            "CONSTRAINT fk_admin_id\n" +
                "FOREIGN KEY (user_id)\n" +
                "REFERENCES GL_USER (id)\n" +
                "ON DELETE NO ACTION\n" +
                "ON UPDATE NO ACTION\n" +
        ");";

        this.ds.query(Q)
            .then(function() {
                resolve()
            })
            .then(null, function(err){
                reject(err);
            });
// ------------------------------------------------
    }.bind(this));
// end promise wrapper
};

Lic_MySQL.prototype.createLicenseMapTable = function(){
    return when.promise(function(resolve, reject){

        // IF NOT EXIST
        var Q = "CREATE TABLE GL_LICENSE_MAP(\n" +
            "id BIGINT(20) NULL AUTO_INCREMENT,\n" +
            "user_id BIGINT(20) NULL,\n" +
            "license_id BIGINT(20) NULL,\n" +
            "status VARCHAR(20) NULL,\n" +
            "PRIMARY KEY (id),\n" +
            "INDEX fk_user_id_idx (user_id ASC),\n" +
            "INDEX fk_license_id_idx (license_id ASC),\n" +
            "UNIQUE INDEX uq_user_license (user_id ASC, license_id ASC),\n" +
            "CONSTRAINT fk_educator_id\n" +
                "FOREIGN KEY (license_id)\n" +
                "REFERENCES GL_USER (id)\n" +
                "ON DELETE NO ACTION\n" +
                "ON UPDATE NO ACTION,\n" +
            "CONSTRAINT fk_license_id\n" +
                "FOREIGN KEY (license_id)\n" +
                "REFERENCES GL_LICENSE (id)\n" +
                "ON DELETE NO ACTION\n" +
                "ON UPDATE NO ACTION\n" +
        ");";
        this.ds.query(Q)
            .then(function(){
                resolve();
            })
            .then(null, function(err){
                reject(err);
            })
    }.bind(this));
};


// add lic map table and add game_id to license table
Lic_MySQL.prototype.updateLicenseTable = function() {
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------
    return resolve();
    // IF NOT EXISTS
    var Q = "CREATE TABLE GL_LICENSE_MAP (" +
        "`id` BIGINT(20) NULL AUTO_INCREMENT," +
        "`user_id` BIGINT(20) NULL," +
        "`license_id` BIGINT(20) NULL," +
        "`institution_id` BIGINT(20) NULL," +
        " PRIMARY KEY (`id`)," +
        " INDEX `fk_license_id_idx` (`license_id` ASC)," +
        " INDEX `fk_institution_id_idx` (`institution_id` ASC)," +
        " INDEX `fk_user_id_idx` (`user_id` ASC)," +
        " UNIQUE INDEX `uq_user_lic_inst` (`user_id` ASC, `license_id` ASC, `institution_id` ASC)," +
        " CONSTRAINT `fk_user_id`" +
        "   FOREIGN KEY (`user_id`)" +
        "   REFERENCES `GL_USER` (`id`)" +
        "   ON DELETE NO ACTION" +
        "   ON UPDATE NO ACTION," +
        " CONSTRAINT `fk_license_id`" +
        "   FOREIGN KEY (`license_id`)" +
        "   REFERENCES `GL_LICENSE` (`ID`)" +
        "   ON DELETE NO ACTION" +
        "   ON UPDATE NO ACTION," +
        "   CONSTRAINT `fk_institution_id`" +
        "   FOREIGN KEY (`institution_id`)" +
        "   REFERENCES `GL_INSTITUTION` (`ID`)" +
        "   ON DELETE NO ACTION" +
        "   ON UPDATE NO ACTION)";

    // create user/institution/lic map
    this.ds.query(Q)
        .then(function(results) {
            if(results) {
                //console.log("updateLicenseTable create user/institution/lic map:", results);

                // get all license where they they have an insitution id and add them to the map
                Q = "SELECT l.ID as license_id, l.institution_id, u.id as user_id \
                     FROM GL_LICENSE l JOIN GL_USER u on l.institution_id = u.institution_id \
                     WHERE l.institution_id IS NOT NULL AND u.SYSTEM_ROLE != 'student'";
                return this.ds.query(Q);
            }
        }.bind(this),
        function(err) {
            if(err.code == "ER_TABLE_EXISTS_ERROR") {
                // already crated, all ok no more migration needed
                //resolve(false);
            } else {
                reject(err);
            }
        }.bind(this))

        .then(function(results) {
            if(!results) return;

            //console.log("updateLicenseTable all license:", results);

            Q = [];
            for(var i = 0; i < results.length; i++){
                Q.push(" ("+
                    this.ds.escape(results[i].license_id)+", "+
                    this.ds.escape(results[i].institution_id)+", "+
                    this.ds.escape(results[i].user_id)+")");
            }

            Q = "INSERT INTO GL_LICENSE_MAP (`license_id`, `institution_id`, `user_id`) VALUES\n"+Q.join(",\n");
            //console.log("updateLicenseTable Q:", Q);
            return this.ds.query(Q);
        }.bind(this))

        .then(function() {
            //console.log("updateLicenseTable added to map:", results);

            // check that GL_LICENSE has game_id
            Q = "DESCRIBE GL_LICENSE";
            return this.ds.query(Q);
        }.bind(this))

        .then(function(results) {
            if(results) {

                var updating = true;
                for(var i = 0; i < results.length; i++) {
                    if (results[i]['Field'] == 'game_id') {
                        updating = false;
                        break;
                    }
                }

                if(updating) {
                    // need to update
                    Q = "ALTER TABLE GL_LICENSE " +
                        "ADD COLUMN `game_id` VARCHAR(255) NOT NULL DEFAULT 'SC' AFTER `SEATS`";
                    this.ds.query(Q)
                        .then(function(results) {
                            if(results) {
                                //console.log("updateLicenseTable ALTER TABLE GL_LICENSE:", results);
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        }.bind(this))

                        // catch all errors
                        .then(null, function(err) {
                            reject({"error": "failure", "exception": err}, 500);
                        }.bind(this));
                } else {
                    resolve(false);
                }
            }
        }.bind(this))

        // catch all errors
        .then(null, function(err) {
            reject({"error": "failure", "exception": err}, 500);
        }.bind(this));

// ------------------------------------------------
}.bind(this));
// end promise wrapper
};

exampleOut.verifyLicense = true; // boolean true or false
Lic_MySQL.prototype.verifyLicense = function(licenseKey) {
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------

    var Q =
        "SELECT \
            id, \
            license_key \
        FROM GL_LICENSE \
        WHERE enabled=1 AND \
        EXPIRATION_DATE > NOW() AND \
        REDEEMED=0 AND \
        license_key="+ this.ds.escape(licenseKey);

    this.ds.query(Q)
        .then(function(results) {
                resolve(results);
            }.bind(this),
            function(err) {
                reject({"error": "failure", "exception": err}, 500);
            }.bind(this)
        );

// ------------------------------------------------
}.bind(this));
// end promise wrapper
};


Lic_MySQL.prototype.getLicenses = function(userId) {
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------

    var Q =
        "SELECT \
            l.license_key,\
            l.game_id, \
            l.partner_id,\
            l.last_updated as activition_date, \
            l.expiration_date,\
            l.seats \
        FROM GL_LICENSE l \
        JOIN GL_LICENSE_MAP lm on lm.license_id=l.id \
        WHERE l.enabled=1 AND \
        l.REDEEMED=1 AND \
        lm.user_id="+ this.ds.escape(userId);

    this.ds.query(Q)
        .then(function(results) {
            resolve(results);
        }.bind(this),
        function(err) {
            reject({"error": "failure", "exception": err}, 500);
        }.bind(this)
    );

// ------------------------------------------------
}.bind(this));
// end promise wrapper
};

Lic_MySQL.prototype.registerLicense = function(licenseId, userId) {
// add promise wrapper
    return when.promise(function(resolve, reject) {
// ------------------------------------------------

        var Q = "INSERT INTO GL_LICENSE_MAP (`license_id`, `user_id`) VALUES" +
            "("+
            this.ds.escape(licenseId)+", "+
            this.ds.escape(userId)+
            ")";

        this.ds.query(Q)
            .then(function(results) {
                resolve(results);
            }.bind(this),
            function(err) {
                reject({"error": "failure", "exception": err}, 500);
            }.bind(this)
        );

// ------------------------------------------------
    }.bind(this));
// end promise wrapper
};

Lic_MySQL.prototype.redeemLicense = function(licenseId, expirationDate) {
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------

    var Q = "UPDATE GL_LICENSE SET REDEEMED=1, last_updated=NOW(), " +
        "expiration_date=FROM_UNIXTIME("+this.ds.escape(expirationDate)+") " +
        "WHERE id="+this.ds.escape(licenseId);

    this.ds.query(Q)
        .then(function(results) {
            resolve(results);
        }.bind(this),
        function(err) {
            reject({"error": "failure", "exception": err}, 500);
        }.bind(this)
    );

// ------------------------------------------------
}.bind(this));
// end promise wrapper
};