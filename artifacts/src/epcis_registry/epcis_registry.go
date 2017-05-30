
package main

import (
	//"encoding/json"
	//"time"
	"fmt"
	//"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	"epcis_registry/model"
	"epcis_registry/worldstate"
)

// EpcisChaincode 
type EpcisChaincode struct {
}


// Init initializes chaincode
// ===========================
func (t *EpcisChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
/*
	_, args := stub.GetFunctionAndParameters()
	var A, B string    // Entities
	var Aval, Bval int // Asset holdings
	var err error

	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	}

	// Initialize the chaincode
	A = args[0]
	Aval, err = strconv.Atoi(args[1])
	if err != nil {
		return shim.Error("Expecting integer value for asset holding")
	}
	B = args[2]
	Bval, err = strconv.Atoi(args[3])
	if err != nil {
		return shim.Error("Expecting integer value for asset holding")
	}
	fmt.Printf("Aval = %d, Bval = %d\n", Aval, Bval)

	// Write the state to the ledger
	err = stub.PutState(A, []byte(strconv.Itoa(Aval)))
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(B, []byte(strconv.Itoa(Bval)))
	if err != nil {
		return shim.Error(err.Error())
	}
*/
	return shim.Success(nil)
}

// Init initializes chaincode
// ===========================
func (t *EpcisChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()

	switch function {
    	case "addEpcThing":
    		return t.addEpcThing(stub, args)
    	case "delete":
    		return t.delete(stub, args)
    	case "readEpcThing":
    		return t.readEpcThing(stub, args)

	}

	return shim.Error("Invalid invoke function name: " + function + " args: ")
}

// ===============================================
// addEpcThing - add epcThing to world-state
// ===============================================
func (t *EpcisChaincode) addEpcThing(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var err error
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting only one xml argument")
	}

	data := args[0]

	//unmarshal the data
	v, err := model.UnmarshalObjectEvent(data);
	if err != nil {
		return shim.Error(err.Error())
	}

	//iterate over all epcid in the epclist, and update each epcid
	for _, epcid := range v.EpcList {
		et := model.BuildEpcThingFromObjectEvent(epcid, v)
		err := worldstate.SaveEpcisThing(stub, et)
		if err != nil {
			return shim.Error(err.Error())
		}
	}	

	return shim.Success(nil)
}



// ===============================================
// delete - Deletes an entity from state
// ===============================================
func (t *EpcisChaincode) delete(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	epcid := args[0]

	// Delete the key from the state in ledger
	err := stub.DelState(epcid)
	if err != nil {
		return shim.Error("Failed to delete state")
	}

	return shim.Success(nil)
}

// ===============================================
// readEpcThing - read a epcThing from chaincode state
// ===============================================
func (t *EpcisChaincode) readEpcThing(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var epcid, jsonResp string
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting epcid of the epcThing to query")
	}

	epcid = args[0]
	valAsbytes, err := stub.GetState(epcid) //get the epcThing from chaincode state
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + epcid + "\"}"
		return shim.Error(jsonResp)
	} else if valAsbytes == nil {
		jsonResp = "{\"Error\":\"epcThing does not exist: " + epcid + "\"}"
		return shim.Error(jsonResp)
	}

	return shim.Success(valAsbytes)
}

func main() {
	err := shim.Start(new(EpcisChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
