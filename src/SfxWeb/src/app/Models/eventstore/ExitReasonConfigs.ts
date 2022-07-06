import { IExitReason } from "src/app/modules/event-store/event-store/event-store.component";

export let ExitReasonConfigs : IExitReason[] = [
    {
        exitCode: 7148,
        exitReason: "Aborting since deactivation failed."
    },
    {
        exitCode: 0,
        exitReason: "Unexpected Termination - Please look at your application logs/dump or debug your code package for more details."
    }
]