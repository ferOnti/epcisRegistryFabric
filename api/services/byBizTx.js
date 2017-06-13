function (doc) {
	if (doc.chaincodeid && doc.chaincodeid == "CHAINCODE_ID") { 
		if (doc.data && doc.data.bizTransaction && doc.data.assetType == "thing") {
			for (i = 0; i< doc.data.bizTransaction.length;i++) {
				emit([doc.data.bizTransaction[i].id, doc.data.bizStep], 1); 
			}
		}
	} 
}