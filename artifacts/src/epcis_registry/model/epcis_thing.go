package model

import (
	"time"
	"fmt"
)

type EpcBizTransaction struct {
	Type   string   `json:"type"`
	Id     string   `json:"id"`
}
type EpcThingfield struct {
	Fieldname   string   `json:"fieldname"`
	Value       string   `json:"value"`
}

type EpcThing struct {
	Epcid               string         `json:"epcid"` 
	EventTime           time.Time      `json:"eventTime"`    
	RecordTime          time.Time      `json:"recordTime"`    
	BizStep             string         `json:"bizStep"`    
	Disposition         string         `json:"disposition"`    
	BizLocation         string         `json:"bizLocation"`
	BizTransaction      []EpcBizTransaction `json:"bizTransaction"`
	EventTimeZoneOffset string          `json:"eventTimeZoneOffset"`    
	Action              string          `json:"action"`    
	ReadPoint           string          `json:"readPoint"`    
	Fields              []EpcThingfield `json:"fields"`   	
}

func BuildEpcThingFromObjectEvent(epcid string, v *ObjectEvent) (*EpcThing) {		
	et := &EpcThing{}
	et.Epcid           = epcid
	et.BizStep         = v.BizStep
	et.EventTime       = v.EventTime
	et.RecordTime      = v.RecordTime
	et.EventTimeZoneOffset = v.EventTimeZoneOffset
	et.Action              = v.Action
	et.Disposition         = v.Disposition
	if (len(v.ReadPoint) == 1) {
		et.ReadPoint           = v.ReadPoint[0]
	}
	if (len(v.BizLocation) == 1) {
		et.BizLocation           = v.BizLocation[0]
	}

	for _, bizTx := range v.BizTransactionList {
		tx := EpcBizTransaction{bizTx.Type, bizTx.Value}
		et.BizTransaction = append(et.BizTransaction, tx)
		fmt.Printf("%#v\n", et.BizTransaction)
	}

	for _, thing := range v.ThingList {
		if (thing.Epcid == epcid) {
			fmt.Printf("fields: %v\n", thing.ThingfieldList)
			for _, thingField := range thing.ThingfieldList {
				tf := EpcThingfield{thingField.Name, thingField.Value}
				et.Fields = append(et.Fields, tf)
				fmt.Printf("%#v\n", et.Fields)
			}

		}
	}
	fmt.Printf("EpcisThing: %#v\n\n", et )

	return et
}

