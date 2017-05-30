'use strict';

var term = require( 'terminal-kit' ).terminal ;
var path = require('path');
var fs = require('fs');
var util = require('util');

var log4js = require('log4js');
var logger = log4js.getLogger('fabric.js');

var config = require('../config.json');
var helper = require('./helper.js');

var hfc = require('fabric-client');
var utils = require('fabric-client/lib/utils.js');
var Peer = require('fabric-client/lib/Peer.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var EventHub = require('fabric-client/lib/EventHub.js');

var client = null;
var chain = null;
var eventhub = null;
var tx_id = null;
var nonce = null;
var adminUser = null;
var org = null;
var orgName = null;
var ORGS = null

var targets = [];
var allEventhubs = [];
var eventhubs = [];

function initGlobalVars() {
	logger.setLevel('DEBUG');
	if (!process.env.GOPATH){
		process.env.GOPATH = config.goPath;
	}
}

module.exports.init = function() {
    return new Promise(function(resolve, reject){
		initGlobalVars()
		term.nextLine(1)

		org = config.orgsList[0]; // org1
		hfc.addConfigFile(path.join(__dirname, 'network-config.json'));
		ORGS = hfc.getConfigSetting('network-config');
		orgName = ORGS[org].name;

		client = new hfc()
		chain = client.newChain(config.channelName);
		chain.addOrderer(new Orderer(config.orderer.orderer_url));

		for (let key in ORGS[org]) {
			if (ORGS[org].hasOwnProperty(key)) {
				if (key.indexOf('peer') === 0) {
					let data = fs.readFileSync(path.join(__dirname, ORGS[org][key]['tls_cacerts']));
					let peer = new Peer(
						ORGS[org][key].requests,
						{
							pem: Buffer.from(data).toString(),
							'ssl-target-name-override': ORGS[org][key]['server-hostname']
						}
					);

					targets.push(peer);
					chain.addPeer(peer);
				}
			}
		}
	    resolve(true);

	})
}

/*
var myFn = function(param){
    return new Promise(function(resolve, reject){
        var calc = doSomeCalculation(param);
        if(calc === null) { // or some other way to detect error
            reject(new Error("error with calculation"), null);
        }
        someAsyncOp(calcN,function(err, finalResult){
            if(err) reject(err);
            resolve(finalResult);
        })
    });
};

*/

module.exports.getSubmitter = function() {
    return new Promise(function(resolve, reject){
		term.nextLine(1)
		term.eraseDisplayBelow();

		hfc.newDefaultKeyValueStore({
			path: helper.getKeyStoreForOrg(orgName)
		}).then(function(store) {
			client.setStateStore(store);
		   	return helper.getSubmitter(client, org);
		}).then(
			function(admin) {
				logger.info('Successfully obtained enrolled user to deploy the chaincode');
				adminUser = admin;

				resolve(admin);
			},
			function(err) {
				logger.info('xxx');
				//reject(new Error('Failed to enroll user \'admin\'. ' + err), null);
				//reject('Failed to enroll user \'admin\'. ' + err);
				throw new Error('Failed to enroll user \'admin\'. ' + err);
			}
		)
	})
}

module.exports.deploy = function() {
	term.nextLine(1)
	term.eraseDisplayBelow();

	logger.info('Executing Deploy with user ');
	var nonce = utils.getNonce();
	tx_id = chain.buildTransactionID(nonce, adminUser);
	var args = helper.getArgs(config.deployRequest.args);

	// send proposal to endorser
	var request = {
		targets: targets,
		chaincodePath: config.chaincodePath,
		chaincodeId: config.chaincodeId,
		chaincodeVersion: config.chaincodeVersion,
		txId: tx_id,
		nonce: nonce
	};
	console.log("sendInstallProposal(request)");
	console.log(request);
			return chain.sendInstallProposal(request);


}

module.exports.readFile = function(path) {
	return new Promise(function(resolve, reject) {
		fs.readFile(path, function(err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
};