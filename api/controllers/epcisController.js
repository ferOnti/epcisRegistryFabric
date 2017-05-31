'use strict';

var mongoose = require('mongoose'),
    Task = mongoose.model('Tasks');

var helper = require('../helper.js');
var couchdb = require('../services/couchdb')


exports.stats = function(req, res) {
    var response = res
    return couchdb.getStats().then( (data) => {
      console.log(data)
      response.send (data)
    })
}

exports.query = function(req, res) {
    var response = res
    console.log(response)
    return couchdb.getEpcisStatesIds().then( (data) => {
      console.log(data)
      response.send (data)
    })
}


exports.getEpcid = function(req, res) {
    var contentType = req.headers['content-type'] || ''
    , mime = contentType.split(';')[0];

    let id = req.params.id
    let response = res

    return couchdb.getEpcid(id).then( (data) => {
      console.log(data)
      response.send (data)
    }).catch( function(err) {
      response.send(err)
    })

};

exports.postEpcisEvent = function(req, res) {
    var contentType = req.headers['content-type'] || ''
    , mime = contentType.split(';')[0];

    if (mime != "application/xml") {
        res.send( {"error":"xml is the only valid format to send epcEvents"})
    }
    //console.log (req.rawBody)
    let xml = req.rawBody

    var args = [xml];
        return new Promise((resolve, reject) => {
            helper.invokeAddThing(res, args);
    });
};

/*
exports.addEpcthing = function(req, res) {

    var xml = '<ObjectEvent><eventTime>2017-01-06T15:39:24Z</eventTime>' + 
      '<eventTimeZoneOffset>-05:00</eventTimeZoneOffset>' +
      '<epcList>' +
        '<epc>urn:epc:id:sgtin:41065887.79796.0000000100</epc>' +
      '</epcList>' +
      '<disposition>urn:epcglobal:cbv:disp:in_progress</disposition>' +
      '<readPoint><id>urn:epc:id:sgln:0012345.000002</id></readPoint>' +
      '<bizLocation><id>urn:epc:id:sgln:0012345.0002</id></bizLocation>' +
      '<bizTransactionList>' +
        '  <bizTransaction type="urn:epcglobal:cbv:btt:bol">po:0001</bizTransaction>' +
      '</bizTransactionList>' +
        '<thingList>' + 
        '  <thing epcid="urn:epc:id:sgtin:41065887.79796.0000000100">' + 
        '    <thingfield name="campo1">Super Desktop-Fan</thingfield>' + 
        '    <thingfield name="campo2">Super Desktop-Fan</thingfield>' + 
        '    <thingfield name="name">Super Desktop-Fan</thingfield>' + 
        '    <thingfield name="price">1234.99</thingfield>' + 
        '  </thing>' + 
        '</thingList>' +
      '</ObjectEvent>';

  var args = [xml];
  return new Promise((resolve, reject) => {
      helper.invokeAddThing(res, args);
  });
};
*/
