export class ConfigLoader {
    isDevTools = false;

    constructor(args: string[]) {
        this.isDevTools = args.includes("devtools");
    }
}