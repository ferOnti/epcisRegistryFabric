'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('Helper');

var path = require('path');
var util = require('util');
var fs = require('fs');
var User = require('fabric-client/lib/User.js');
var utils = require('fabric-client/lib/utils.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var copService = require('fabric-ca-client/lib/FabricCAClientImpl.js');

var config = require('../config.json');
var hfc = require('fabric-client');
var hfc = require('fabric-client');
var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var ORGS = hfc.getConfigSetting('network-config');

var tx_id = null;
var nonce = null;
var adminUser = null;
var allEventhubs = [];
var targets = [];
var eventhubs = [];

var client = null;
var chain = null;

hfc.addConfigFile(path.join(__dirname, 'network-config.json'));

logger.setLevel('DEBUG');

module.exports.getSubmitter = function(client, userOrg) {
	var caUrl = ORGS[userOrg].ca;
	var users = config.users;
	var username = users[0].username;
	var password = users[0].secret;
	var member;

	return client.getUserContext(username)
		.then((user) => {
			if (user && user.isEnrolled()) {
				logger.info('Successfully loaded member from persistence');
				return user;
			} else {
				var ca_client = new copService(caUrl);
				// need to enroll it with CA server
				return ca_client.enroll({
					enrollmentID: username,
					enrollmentSecret: password
				}).then((enrollment) => {
					logger.info('Successfully enrolled user \'' + username + '\'');

					member = new User(username, client);
					return member.setEnrollment(enrollment.key, enrollment.certificate, ORGS[userOrg].mspid);
				}).then(() => {
					return client.setUserContext(member);
				}).then(() => {
					return member;
				}).catch((err) => {
					logger.error('Failed to enroll and persist user. Error: ' + err.stack ? err.stack : err);
					throw new Error('Failed to obtain an enrolled user');
				});
			}
		});
};

module.exports.setupChaincodeDeploy = function() {
	process.env.GOPATH = path.join(__dirname, config.GOPATH);
};

module.exports.getLogger = function(moduleName) {
	var logger = log4js.getLogger(moduleName);
	logger.setLevel('DEBUG');
	return logger;
};

module.exports.getOrgName = function(org) {
	return ORGS[org].name;
}

module.exports.getOrderer = function(client, org) {
	var caRootsPath = ORGS.orderer.tls_cacerts;
	let data = fs.readFileSync(path.join(__dirname, caRootsPath));
	let caroots = Buffer.from(data).toString();
	return new Orderer(
		ORGS.orderer.url,
			{
				'pem': caroots,
				'ssl-target-name-override': ORGS.orderer['server-hostname']
			}
		)
};

module.exports.getKeyStoreForOrg = function(org) {
	return config.keyValueStore + '_' + org;
};

module.exports.getArgs = function(chaincodeArgs) {
	var args = [];
	for (var i = 0; i < chaincodeArgs.length; i++) {
		args.push(chaincodeArgs[i]);
	}
	return args;
};

module.exports.getTxId = function() {
	return utils.buildTransactionID({
		length: 12
	});
};

module.exports.getOrg = function(org) {
	client = new hfc();
	chain = client.newChain(config.channelName);
	logger.info("getOrg setup for %s ", org)

	ORGS = hfc.getConfigSetting('network-config');

	chain.addOrderer(
		this.getOrderer()
	);

	var orgName = ORGS[org].name;
	targets = [];
	eventhubs = [];
	// set up the chain to use each org's 'peer1' for
	// both requests and events
	for (let key in ORGS) {
		if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
			let data = fs.readFileSync(path.join(__dirname, ORGS[key].peer1['tls_cacerts']));
			let peer = new Peer(
				ORGS[key].peer1.requests,
				{
					pem: Buffer.from(data).toString(),
					'ssl-target-name-override': ORGS[key].peer1['server-hostname']
				}
			);
			chain.addPeer(peer);

			let eh = new EventHub();
			eh.setPeerAddr(
				ORGS[key].peer1.events,
				{
					pem: Buffer.from(data).toString(),
					'ssl-target-name-override': ORGS[key].peer1['server-hostname']
				}
			);
			eh.connect();
			eventhubs.push(eh);
			allEventhubs.push(eh);
		}
	}

	return hfc.newDefaultKeyValueStore({
	    path: this.getKeyStoreForOrg(orgName)
	}).then((store) => {
		client.setStateStore(store);
    	return this.getSubmitter(client, org);
	}).then((admin) => {

		logger.info('Successfully enrolled user \'admin\'');
		adminUser = admin;
	}, (err) => {

		logger.error('Failed to enroll user \'admin\'. ' + err);
		throw new Error('Failed to enroll user \'admin\'. ' + err);
	})
};


module.exports.invokeAddThing = function(res, args) {
	logger.info('invoke addThing with user: "%s" from %s', adminUser._name, adminUser._mspImpl._id);
	nonce = utils.getNonce();
	tx_id = chain.buildTransactionID(nonce, adminUser);
	utils.setConfigSetting('E2E_TX_ID', tx_id);
	logger.info(util.format('Sending transaction "%s"', tx_id));

	// send proposal to endorser
	var transactionRequest = {
		chaincodeId: config.chaincodeId,
		chaincodeVersion: config.chaincodeVersion,
		chainId: config.channelName,
		fcn: "addEpcThing",
		args: args,
		txId: tx_id,
		nonce: nonce
	};
	return chain.sendTransactionProposal(transactionRequest).then(
		(results) => {

		var proposalResponses = results[0];
		var proposal = results[1];
		var header   = results[2];
		var all_good = true;

		for(var i in proposalResponses) {
			let one_good = false;
			if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
				one_good = true;
				//logger.info('transaction proposal was good');
			} else {
				logger.error('transaction proposal was bad');
			}
			all_good = all_good & one_good;
		}

		if (all_good) {
			var message = util.format('Successfully sent Proposal and received ProposalResponse: Status - %s ', proposalResponses[0].response.status);

			//next return api response
			var response = {}
			//response.message = message;
			response.txId       = transactionRequest.txId;
			//response.function = transactionRequest.fcn;
			//response.args     = transactionRequest.args;
			res.send(response)
			//next(true)

			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal,
				header: header
			};

			// if the transaction did not get committed within the timeout period,
			// fail the test
			var deployId = tx_id.toString();

			//var eventPromises = [];
			//eventhubs.forEach((eh) => {
			//	let txPromise = new Promise((resolve, reject) => {
			//		let handle = setTimeout(reject, 30000);

			//		eh.registerTxEvent(deployId.toString(), (tx, code) => {
			//			clearTimeout(handle);
			//			eh.unregisterTxEvent(deployId);

			//			if (code !== 'VALID') {
			//				logger.error('The balance transfer transaction was invalid, code = ' + code);
			//				reject();
			//			} else {
			//				logger.info('The transaction %s has been committed on peer %s', tx, eh.ep._endpoint.addr);
			//				resolve();
			//			}
			//		});
			//	});

			//	eventPromises.push(txPromise);
			//});

			return  chain.sendTransaction(request);
			//return sendPromise.then( (results) =>
			//	logger.info("event sendTransaction done for tx "+ deployId)
			//	logger.info(results)
			//).catch((err) => {logger.error(err); })

			//return Promise.all([sendPromise].concat(eventPromises))
			//.then((results) => {
			//	logger.debug(' event promise all complete for tx %s', deployId);
			//	return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call

			//}).catch((err) => {

			//	logger.error('Failed to send transaction and get notifications within the timeout period.');
			//	throw new Error('Failed to send transaction and get notifications within the timeout period.');

			//});

		} else {
			logger.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
			throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		}
	}, (err) => {
		logger.error('Failed to send proposal due to error: ' + err.stack ? err.stack : err);
		throw new Error('Failed to send proposal due to error: ' + err.stack ? err.stack : err);
	}).then((response) => {
		if (response.status === 'SUCCESS') {
			logger.info('Successfully sent transaction to the orderer.');
		} else {
			logger.error('Failed to order the transaction. Error code: ' + response.status);
			throw new Error('Failed to order the transaction. Error code: ' + response.status);
		}
	}, (err) => {
		logger.error('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
		throw new Error('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
	}).catch((err)=> {
		logger.error('**error: ' + err.stack ? err.stack : err);
	});
};






