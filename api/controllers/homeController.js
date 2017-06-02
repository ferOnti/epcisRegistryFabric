'use strict';

var couchdb = require('../services/couchdb')

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
      	response.render('hello', params );
    }).catch( function(err) {
      console.log(err)
		response.render('hello', params );
    })
};


exports.query = function(req, res, next) {
    return res.render('query');   // this is the important part
};
