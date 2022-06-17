import { IConcurrentEventsConfig } from "src/app/modules/event-store/event-store/event-store.component";

export let RelatedEventsConfigs : IConcurrentEventsConfig[] = [{
    "eventType": "ApplicationProcessExited",        
    "relevantEventsType": [
        "ApplicationUpgradeStarted", 
        "ApplicationUpgradeCompleted", 
        "NodeDown", 
        "NodeDeactivateCompleted",
        "NodeRemovedFromCluster"
    ]
},
{
    "eventType": "NodeDown",
    "relevantEventsType": ["ClusterUpgradeStarted", "ClusterUpgradeCompleted"]
},
{
    "eventType": "NodeDeactivateCompleted",
    "relevantEventsType": ["RepairJob"]
}];