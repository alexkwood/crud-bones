var uuid        = require('node-uuid'),
    mongoose    = require('mongoose'),
    util        = require('util'),
    helper      = require('../helper'),
    dateformat  = require('dateformat');

function DaoMongo(cfg, conn, log) {
    if (!cfg || !conn || !log) {
        throw new Error("Config and connection vars,  and log function are required.");
    }
    this.config = cfg;
    this.connection = conn;
    this.log = log;
    this.models = { };
}

DaoMongo.prototype.registerModel = function(itemClass) {
    var modelName = helper.capitalize(itemClass.entityName + 'MongoModel');
    this.models[modelName] = new mongoose.Schema( itemClass.entitySchema );
};

DaoMongo.prototype.create = function(item, callback) {
    var that = this;
    var created = dateformat('yyyy-mm-dd HH:MM:ss');
    var item_id = uuid();
    if (item) {
        item[ item.getEntityIndex() ] = item_id;
        item[ item.getEntityCreated() ] = created;
        var modelName = helper.capitalize(item.getEntityName() + 'MongoModel');
        var NeededMongoModel = this.connection.model(modelName, this.models[modelName]);
        var m = new NeededMongoModel();
        var propNames = item.getPropNamesAsArray();
        // basically here we load all data from item into this mongo model
        for (var i = 0; i != propNames.length; i++) {
            m[ propNames[i] ] = item[ propNames[i] ];
        }
        that.log( util.inspect(m) );
        m.save(function(err) {
            if (err) {
                that.log('Error: create(): ' + err);
            }
            if (callback) {
                callback(false, item);
            }
            return item;
        });
    } else {
        this.log('Error: create(): cannot save item');
        if (callback) {
            callback(true, null);
        }
        return null;
    }
};

DaoMongo.prototype.update = function(item, callback) {
    var that = this;
    var created = dateformat('yyyy-mm-dd HH:MM:ss');
    if (item) {
        var modelName = helper.capitalize(item.getEntityName() + 'MongoModel');
        var NeededMongoModel = this.connection.model(modelName, this.models[modelName]);
        var itemId = (item.asArray())[0];
        var findObj = { };
        findObj[ item.getEntityIndex() ] = itemId;
        var propNames = item.getPropNamesAsArray();
        var slicedFields = propNames.slice(-propNames.length+1);    // without index
        var updateObj = { };
        for (var i = 0; i != slicedFields.length; i++) {
            updateObj[ slicedFields[i] ] = item[ slicedFields[i] ];
        }
        this.log('update(): ' + JSON.stringify(findObj));
        this.log('update(): ' + JSON.stringify(updateObj));
        var options = { };
        NeededMongoModel.update(findObj, { $set: updateObj }, options, function(err){
            if (err) {
                that.log('Error: update(): ' + err);
            }
            if (callback) {
                callback(false, item);
            }
            return item;
        });
    } else {
        this.log('Error: update(): cannot update item');
        if (callback) {
            callback(true, null);
        }
        return null;
    }
};

DaoMongo.prototype.list = function(itemClass, propNames, callback) {
    var modelName = helper.capitalize(itemClass.entityName + 'MongoModel');
    var NeededMongoModel = this.connection.model(modelName, this.models[modelName]);
    var query = NeededMongoModel.find( { } );
    query.execFind(function (err, results) {
        if (err) {
            that.log('Error: list(): ' + err);
        }
        if (callback) {
            callback(false, results);
        }
        return results;
    }); 
};

DaoMongo.prototype.get = function(itemClass, itemId, callback) {
    var modelName = helper.capitalize(itemClass.entityName + 'MongoModel');
    var NeededMongoModel = this.connection.model(modelName, this.models[modelName]);
    var findObj = { };
    findObj[ itemClass.entityIndex ] = itemId;
    NeededMongoModel.findOne(findObj, function (err, result) {
        if (err) {
            that.log('Error: get(): ' + err);
        }
        if (callback) {
            callback(false, result);
        }
        return result;
    });
};

DaoMongo.prototype.remove = function(itemClass, itemId, callback) {
    var modelName = helper.capitalize(itemClass.entityName + 'MongoModel');
    var NeededMongoModel = this.connection.model(modelName, this.models[modelName]);
    var findObj = { };
    findObj[ itemClass.entityIndex ] = itemId;
    NeededMongoModel.remove(findObj, function (err, result) {
        if (err) {
            that.log('Error: remove(): ' + err);
        }
        if (callback) {
            callback(false, result);
        }
        return result;
    });    
};

module.exports.DaoMongo = DaoMongo;