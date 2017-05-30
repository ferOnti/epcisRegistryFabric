
"use strict";
var util = require('util');
var path = require('path');
var fs = require('fs');
var grpc = require('grpc');
const _ = require('lodash');

var hfc = require('fabric-client');
var utils = require('fabric-client/lib/utils.js');
var Peer = require('fabric-client/lib/Peer.js');
var Chain = require('fabric-client/lib/Chain.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var config = require('../config.json');
var helper = require('./helper.js');
var logger = helper.getLogger('Chain Info');
hfc.addConfigFile(path.join(__dirname, 'network-config.json'));
var ORGS = hfc.getConfigSetting('network-config');

	logger.debug('\n============ Peer Info ============\n');

	var org = config.orgsList[0];
	var client = new hfc();
	var chain = new Chain(config.channelName, client);

    chain.addOrderer(
        helper.getOrderer()
    );
    var orgName = ORGS[org].name;
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
                });
            chain.addPeer(peer);
        }
    }
    let peer = null;
    if (ORGS.hasOwnProperty(org) && typeof ORGS[org].peer1 !== 'undefined') {
        let data = fs.readFileSync(path.join(__dirname, ORGS[org].peer1['tls_cacerts']));
        peer = new Peer(
            ORGS[org].peer1.requests,
            {
                pem: Buffer.from(data).toString(),
                'ssl-target-name-override': ORGS[org].peer1['server-hostname']
            });
    }
    console.log (peer)
    if (peer == null ) {
        logger.info('Failed to get peer \'admin\'');
        return ;
    }
    var response = {
        channels : [],
        chaincodes : []
    };
    return hfc.newDefaultKeyValueStore({
        path: helper.getKeyStoreForOrg(orgName)
    }).then((store) => {
        client.setStateStore(store);
        return helper.getSubmitter(client, org);
    }).then((admin) => {  // Access to the user
        logger.info('Successfully enrolled user \'admin\'');
        return chain.queryChannels(peer);
    }).then((result) => {
        var channels = _.sortBy(result.channels, [channel => channel.channel_id]);
        response.channels = channels;
        return chain.queryInstalledChaincodes(peer)
    }).then((result) => {
        response.chaincodes =  result;
        logger.info(util.format('information by organization %s ', orgName));
        console.log(response);
    }, (err) => {
            logger.info('Failed to get submitter \'admin\'');
            logger.error('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
        }).catch((err) => {
        logger.error('Failed to end to end test with error:' + err.stack ? err.stack : err);
    });
