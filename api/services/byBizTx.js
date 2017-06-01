function (doc) {
	if (doc.chaincodeid && doc.chaincodeid == "CHAINCODE_ID") { 
		if (doc.data && doc.data.bizTransaction) {
			for (i = 0; i< doc.data.bizTransaction.length;i++) {
				emit([doc.data.bizTransaction[i], doc.data.bizStep], 1); 
			}
		}
	} 
}