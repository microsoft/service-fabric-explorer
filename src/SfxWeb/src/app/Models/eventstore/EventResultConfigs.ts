import { IEventResultMapping } from "src/app/modules/event-store/event-store/event-store.component";

export let EventResultConfigs : IEventResultMapping[] = [
    {
        eventType: "ApplicationProcessExited",
        result: ""
    },
    {
        eventType: "NodeDown",
        result: ""
    },
    {
        eventType: "NodeDeactivateStarted",
        result: ""
    },
    {
        eventType: "RepairTask",
        result: "raw.Action"
    },
]