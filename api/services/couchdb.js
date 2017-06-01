//couchdb.js
var config = require('../../config.json');
var fs = require('fs')

var couchdbUrl = config.couchdb[0].couchdb_url
var channelId  = config.channelName
var chaincodeId = config.chaincodeId

var nano = require('nano')(couchdbUrl);
var couchdb = nano.db.use(channelId);

var getStateDb = function () {
	return new Promise((resolve, reject) => {
		couchdb.get('statedb_savepoint', {'include_docs': true}, function(err, body){    
	    	if (err){
    	  		console.log(err)
    	  		reject(err)
    		} else {
        		//console.log(body)
        		resolve(body)
    		}
		})
	}).catch( function(err) {
		console.log("statedb_savepoint")
		console.log(err.message)
    })
}
var byBizStep = function (groupLevel) {
	return new Promise((resolve, reject) => {
		var keys = []
		var options = {
			"reduce" : true,
			"group_level" : groupLevel
		}
		couchdb.view(chaincodeId, 'byBizStep', options, function(err, body){    
	    	if (err){
    	  		console.log(err)
    	  		reject(err)
    		} else {
        		var rows = body.rows; //the rows returned
        		//console.log(body.rows)
	        	//for (var i=0; i<rows.length; i++ ) {
	        	//	var epcid = rows[i].key.replace(chaincodeId,"").replace("\u0000","")
    	      	//	keys.push(epcid)
        		//}
        		//console.log(keys)
        		resolve(body)
    		}
		})
	})

}

module.exports.getStats = function () {
	console.log("getStats")
	var stats = {}
	return byBizStep(0)
		.then((data) => {
			if (data.rows.length > 0) {
				stats.count = data.rows[0].value
			} else {
				stats.count = 0
			}
		})
		.then( () => {
			return byBizStep(1)
		})
		.then((data) => {
			stats.byBizStep = {}
			for (var i=0; i<data.rows.length; i++ ) {
				var key = data.rows[i].key[0]
				var value = data.rows[i].value
				stats.byBizStep[key] = value
			}
		})
		.then( getStateDb )
		.then((data) => {
			stats.blockNumber = data.BlockNum
			stats.txNum = data.TxNum
			console.log(stats)
			return (stats)
		})
	.catch( function(err) {
		console.log("getStats")
		console.log(err.message)
		//reject(err)
    })

}

module.exports.getEpcid = function (id) {
	console.log("getEpcid")

	let docId = chaincodeId + "\u0000" + id
	console.log("  get event id: " + docId)
	return new Promise((resolve, reject) => {
		couchdb.get(docId, {'include_docs': true}, function(err, body){    
	    	if (err){
			    if (err.message == "missing") {
			    	err = {"message":"the epcid " + id + " does not exists in the blockchain"}
			    } 
	    	  	console.log(err)
    		  	reject(err)
    		} else {
        		console.log(body)
        		resolve(body)
    		}
		})
	})
}

module.exports.getEpcisStatesIds = function () {
	console.log("getEpcisStates")

	return new Promise((resolve, reject) => {
		var keys = []
		couchdb.view(chaincodeId, 'byBizStep', {'include_docs': false}, function(err, body){    
	    	if (err){
    	  		console.log(err)
    	  		reject(err)
    		} else {
        		var rows = body.rows; //the rows returned
	        	for (var i=0; i<rows.length; i++ ) {
	        		var epcid = rows[i].key.replace(chaincodeId,"").replace("\u0000","")
    	      		keys.push(epcid)
        		}
        		console.log(keys)
        		resolve(keys)
    		}
		})
	})
}

module.exports.getEpcisStates = function () {
	console.log("getEpcisStates")

	return new Promise((resolve, reject) => {
		var keys = []
		couchdb.view(chaincodeId, 'states', {'include_docs': false}, function(err, body){    
	    	if (err){
    	  		console.log(err)
    	  		reject(err)
    		} else {
        		var rows = body.rows; //the rows returned
	        	for (var i=0; i<rows.length; i++ ) {
	        		var epcid = rows[i].key.replace(chaincodeId,"").replace("\u0000","")
    	      		keys.push(epcid)
        		}
        		console.log(keys)
        		resolve(keys)
    		}
		})
	})
}

module.exports.checkViewForChaincode = function () {
	console.log("checkViewForChaincode")

	return new Promise((resolve, reject) => {
		couchdb.get('_design/'+chaincodeId, function(err, doc) {
	  		if (err && err.statusCode == 404) {
	      		console.log ("insert view for chaincode "+chaincodeId)
	       		couchdb.insert({
	          		"views": {
	             		states: {
	                		"map": function (doc) {
	                  			if (doc.chaincodeid && doc.chaincodeid == "mycc45") { emit(doc._id, 1); } 
	                		}
	             		}
	          		}
	        	}, 
	        	'_design/'+chaincodeId, 
	        	function (err, response) {
	        		if (err) {
	        			reject(err)
	        		} else {
	        			resolve(response)
	        		}
	        	})        
	  		} else {
	      		if (err) {
	        		console.error(err)
	        		reject(err)
	      		} else {
	          		console.log(doc)
	          		resolve(true)
	          	}
	    	}
		})
	})
}


module.exports.createViews = function () {
	console.log("createViews")

	var mapFunction = fs.readFileSync("./api/services/byBizStep.js",'utf8')
	byBizStepMap = mapFunction.replace('CHAINCODE_ID', chaincodeId) 

	mapFunction = fs.readFileSync("./api/services/byBizTx.js",'utf8')
	byBizTxMap  = mapFunction.replace('CHAINCODE_ID', chaincodeId) 

	return new Promise((resolve, reject) => {
		couchdb.get('_design/'+chaincodeId, function(err, doc) {
	  		if (err && err.statusCode == 404) {
	      		console.log ("insert view for chaincode "+chaincodeId)
	       		couchdb.insert({
	          		"views": {
	             		byBizStep: {
	                		"map": byBizStepMap,
	                		"reduce" : "_sum"
	             		},
	             		byBizTx: {
	                		"map": byBizTxMap,
	                		"reduce" : "_sum"
	             		}
	          		}
	        	}, 
	        	'_design/'+chaincodeId, 
	        	function (err, response) {
	        		if (err) {
	        			reject(err)
	        		} else {
	        			resolve("views created sucessfully")
	        		}
	        	})        
	  		} else {
	      		if (err) {
	        		console.error(err)
	        		reject(err)
	      		} else {
	          		console.log("views already created")
        			resolve("views already created")
	          	}
	    	}
		})
	})
	
}


