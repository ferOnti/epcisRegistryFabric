'use strict';

var couchdb = require('../services/couchdb')
var base64 = require('base-64');

/*
  // epcis Routes
  app.route('/event/:id')
    .get(home.query);

  app.route('/api/query')
    .get(home.query);
*/


exports.home = function(req, res, next) {
	var params = {}
	var config = require('../../config.json');

	var couchdbUrl = config.couchdb[0].couchdb_url
	var channelId  = config.channelName
	var chaincodeId = config.chaincodeId

	params.channelName = channelId
	params.chaincodeId = chaincodeId
	params.couchdbUrl  = couchdbUrl

	var response = res
    return couchdb.getStats().then( (data) => {
        params.blockNumber = data.blockNumber
        params.txNum = data.txNum
        params.countThings = data.count
        //convert byBizStep to mustache iterate format
        var byBizStep = []
        for (var key in data.byBizStep) {
          byBizStep.push( {"key": key, "value": data.byBizStep[key]})
        }
        params.byBizStep   = byBizStep

        //byBizTx
        var byBizTx   = []
        for (var key in data.byBizTx) {
          byBizTx.push( {
            "id": base64.encode(data.byBizTx[key].key),
            "key": data.byBizTx[key].key, 
            "key2": data.byBizTx[key].key2, 
            "value": data.byBizTx[key].value
          })
        }
        params.byBizTx   = byBizTx

      	response.render('hello', params );
    }).catch( function(err) {
      console.log(err)
		response.render('hello', params );
    })
};


exports.bizTx = function(req, res, next) {
  var params = {}
  params.id = base64.decode(req.params.id)
  params.base64Id = req.params.id

  var response = res
    return couchdb.getBizTx(params.id, true).then( (data) => {
        //byBizTx
        /*
        var byBizTx   = []
        for (var key in data) {
          byBizTx.push( {
            "id": data[key].id,
            "bizTx": data[key].key[0], 
            "bizStep": data[key].key[1]
          })
        }
        */
        //console.log(params)
        params.byBizTx   = data

        response.render('bizTx', params );
    }).catch( function(err) {
      console.log(err)
    response.render('bizTx', params );
    })

};


exports.query = function(req, res, next) {
    return res.render('query');   // this is the important part
};
