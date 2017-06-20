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
        		resolve(body)
    		}
		})
	})
}

/*
var byBizStepCase = function (groupLevel) {
	return new Promise((resolve, reject) => {
		var keys = []
		var options = {
			"reduce" : true,
			"group_level" : groupLevel
		}
		couchdb.view(chaincodeId, 'byBizStepCase', options, function(err, body){    
	    	if (err){
    	  		console.log(err)
    	  		reject(err)
    		} else {
        		var rows = body.rows; //the rows returned
        		resolve(body)
    		}
		})
	})

}
*/

var byBizTx = function (groupLevel, limit=100) {
	return new Promise((resolve, reject) => {
		var keys = []
		var options = {
			"reduce" : true,
			"group_level" : groupLevel,
			"limit" : limit
		}
		couchdb.view(chaincodeId, 'byBizTx', options, function(err, body){    
	    	if (err){
    	  		console.log(err)
    	  		reject(err)
    		} else {
        		var rows = body.rows; //the rows returned
        		resolve(body)
    		}
		})
	})

}

module.exports.getStats = function () {
	console.log("getStats")
	var stats = {}
	return byBizStep(1)
		.then((data) => {
			stats.counts = {}
			for (var i=0; i<data.rows.length; i++ ) {
				var key = data.rows[i].key[0]
				var value = data.rows[i].value
				stats.counts[key] = value
			}

		})
		//.then( () => {
		//	return byBizStepCase(0)
		//})
		//.then( (data) => {
		//	if (data.rows.length > 0) {
		//		stats.casesCount = data.rows[0].value
		//	} else {
		//		stats.casesCount = 0
		//	}
		//})
		.then( () => {
			return byBizStep(3)
		})
		.then((data) => {
			stats.byBizStep = data.rows;
			/*
			for (var i=0; i<data.rows.length; i++ ) {
			console.log(data.rows[i])
				var key = data.rows[i].key
				var value = data.rows[i].value
				stats.byBizStep[key] = value
			}
			*/
		})
		.then( () => {
			return byBizTx(2, 50)
		})
		.then((data) => {
			stats.byBizTx = []
			for (var i=0; i<data.rows.length; i++ ) {
				var key = data.rows[i].key[0]
				var key2 = data.rows[i].key[1]
				var value = data.rows[i].value
				stats.byBizTx.push({key:key, key2:key2, value:value})
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
    })

}

module.exports.getBizTx = function(id, includeDocs) {
	return new Promise((resolve, reject) => {
		var keys = []
		var options = {
			"reduce" : false,
			"include_docs" : includeDocs,
			"inclusive_end": false,
			"startkey": [id, ""],
			"endkey": [id, "\uffff"]
		}

		couchdb.view(chaincodeId, 'byBizTx', options, function(err, body){    
	    	if (err){
    	  		console.log(err)
    	  		reject(err)
    		} else {
        		var rows = body.rows; //the rows returned
        		var results = []
	        	for (var i=0; i<rows.length; i++ ) {
	        		parsedDoc = {}
	        		if (includeDocs) {
	        			parsedDoc.chaincodeId = rows[i].doc.chaincodeid;
	        			for (key in rows[i].doc.data) {
	        				parsedDoc[key] = rows[i].doc.data[key];
	        			}
	        		} else {
	        			parsedDoc = rows[i]
	        		}
    	      		results.push(parsedDoc)
        		}
        		resolve(results)
    		}
		})
	})

}

module.exports.getEpcid = function (id) {
	console.log("getEpcid")

	let docId = chaincodeId + "\u0000" + id
	console.log("  get epcid: " + docId)
	return new Promise((resolve, reject) => {
		couchdb.get(docId, {'include_docs': true}, function(err, body){    
	    	if (err){
			    if (err.message == "missing") {
			    	err = {"message":"the epcid " + id + " does not exists in the blockchain"}
			    } 
	    	  	console.log(err)
    		  	reject(err)
    		} else {
        		//console.log(body)
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

	//mapFunction = fs.readFileSync("./api/services/byBizStepCase.js",'utf8')
	//byBizStepCaseMap = mapFunction.replace('CHAINCODE_ID', chaincodeId) 

	mapFunction = fs.readFileSync("./api/services/byBizTx.js",'utf8')
	byBizTxMap  = mapFunction.replace('CHAINCODE_ID', chaincodeId) 

	mapFunction = fs.readFileSync("./api/services/byParentId.js",'utf8')
	byParentId  = mapFunction.replace('CHAINCODE_ID', chaincodeId) 

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
	             		//byBizStepCase: {
	                	//	"map": byBizStepCaseMap,
	                	//	"reduce" : "_sum"
	             		//},
	             		byBizTx: {
	                		"map": byBizTxMap,
	                		"reduce" : "_sum"
	             		},
	             		byParentId: {
	                		"map": byParentId,
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

module.exports.supplyChainDashboard = function(id, includeDocs) {
	result = {}
	result.step1 = 0;
	result.step2 = 0;
	result.step3 = 0;
	result.step4 = 0;
	result.step5 = 0;
	result.step6 = 0;
	result.step7 = 0;
	result.step8 = 0;
	result.step9 = 0;
	result.step10 = 0;
	result.step11 = 0;
	result.step12 = 0;
	result.step13 = 0;
	result.step14 = 0;
	result.step15 = 0;
	result.step16 = 0;
	result.step17 = 0;
	result.step18 = 0;
	result.step19 = 0;

	return new Promise((resolve, reject) => {
		var keys = []
		var options = {
			"reduce" : true,
			"group_level" : 3
		}

		couchdb.view(chaincodeId, 'byBizStep', options, function(err, body){    
	    	if (err){
    	  		console.log(err)
    	  		reject(err)
    		} else {
        		var rows = body.rows; //the rows returned
        		console.log(rows)
        		if (body.rows && body.rows.length >0) {
	        		result.step1 = body.rows[0].value;
        		} else {
        			result.step1 = 0
        		}
        		for (row of rows) {
        			//step 1
	        		if (row.key[0] == 1 && 
	        			row.key[1] == 'urn:epc:id:sgln:01234567.4650.0001' &&
	        			row.key[2] == 'urn:epcglobal:cbv:bizstep:commissioning' ) {
	        			result.step1 = row.value
	        		}
        			//step 2
	        		if (row.key[0] == 2 && 
	        			row.key[1] == 'urn:epc:id:sgln:01234567.4650.0001' &&
	        			row.key[2] == 'urn:epcglobal:cbv:bizstep:packing' ) {
	        			result.step2 = row.value
	        		}
        			//step 3
	        		if (row.key[0] == 2 && 
	        			row.key[1] == 'urn:epc:id:sgln:01234567.4650.0001' &&
	        			row.key[2] == 'urn:epcglobal:cbv:bizstep:commissioning' ) {
	        			result.step3 = row.value
	        		}
        			//step 4
	        		if (row.key[0] == 3 && 
	        			row.key[1] == 'urn:epc:id:sgln:01234567.4650.0001' &&
	        			row.key[2] == 'urn:epcglobal:cbv:bizstep:commissioning' ) {
	        			result.step4 = row.value
	        		}
        			//step 5
	        		if (row.key[0] == 3 && 
	        			row.key[1] == 'urn:epc:id:sgln:01234567.4650.0001' &&
	        			row.key[2] == 'urn:epcglobal:cbv:bizstep:packing' ) {
	        			result.step5 = row.value
	        		}
        			//step 6
	        		if (row.key[0] == 3 && 
	        			row.key[1] == 'urn:epc:id:sgln:01234567.4650.0001' &&
	        			row.key[2] == 'urn:epcglobal:cbv:bizstep:shipping' ) {
	        			result.step6 = row.value
	        		}
        			//step 7
	        		if (row.key[0] == 3 && 
	        			row.key[1] == 'urn:epc:id:sgln:09876543.0000.9876' &&
	        			row.key[2] == 'urn:epcglobal:cbv:bizstep:receiving' ) {
	        			result.step7 = row.value
	        		}

        		}
        		resolve(result)
    		}
		})
	})

}




