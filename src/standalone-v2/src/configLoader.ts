import { Logger } from "./logger";
import { NotificationTypes } from "./notificationManager";

export class ConfigLoader {
    isDevTools = false;

    constructor(args: string[], private logger: Logger) {
        this.logger.log(NotificationTypes.Info, args.toString());

        this.isDevTools = args.includes("devtools");
    }
}