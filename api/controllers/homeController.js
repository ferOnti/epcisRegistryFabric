'use strict';

var couchdb = require('../services/couchdb')
var base64 = require('base-64');


exports.home = function(req, res, next) {
	var params = {}
	var config = require('../../config.json');

	var couchdbUrl = config.couchdb[0].couchdb_url
	var channelId  = config.channelName
	var chaincodeId = config.chaincodeId

	params.channelName = channelId
	params.chaincodeId = chaincodeId
  params.couchdbUrl  = couchdbUrl
  params.menuHome    = true

	var response = res
    return couchdb.getStats().then( (data) => {
        params.blockNumber = data.blockNumber
        params.txNum = data.txNum
        params.countThings  = data.counts['1'] ? data.counts['1'] : 0
        params.countCases   = data.counts['2'] ? data.counts['2'] : 0
        params.countPallets = data.counts['3'] ? data.counts['3'] : 0
        params.countErrors  = data.counts['0'] ? data.counts['0'] : 0

        var levels = ["error", "items", "cases", "pallets", "containers"]
        //convert byBizStep to mustache iterate format
        var byBizStep = []
        for (var i in data.byBizStep) {
          var row = data.byBizStep[i]
          byBizStep.push( {"level": levels[row.key[0]], "location": row.key[1], "bizStep": row.key[2], "value": row.value})
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
  params.base64Id  = req.params.id
  params.menuBizTx = true

  var response = res
    return couchdb.getBizTx(params.id, true).then( (data) => {
        params.byBizTx   = data

        response.render('bizTx', params );
    }).catch( function(err) {
      console.log(err)
    response.render('bizTx', params );
    })

};


exports.supplyChain = function(req, res, next) {
    var params = {}
    params.menuSupply = true

    var response = res

    return couchdb.supplyChainDashboard().then( (data) => {
        params.data   = data
console.log(data)
        response.render('supplyChain', params );
    }).catch( function(err) {
      console.log(err)
    response.render('supplyChain', params );
    })

};





