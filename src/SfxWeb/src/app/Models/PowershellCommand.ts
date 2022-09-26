import { Input } from "@angular/core";

export class PowershellCommand{

    private script: (string | PowershellCommandInput)[]

    constructor(public name: string, private rawScript: string, public inputs: PowershellCommandInput[] = []) {

        this.script = rawScript.split(" ");

        let inputIndex = 0;
        let scriptInsertIndex = this.script.findIndex(x => x === "{}");
        while (scriptInsertIndex !== -1) {
            this.script[scriptInsertIndex] = this.inputs[inputIndex];
            inputIndex++;
            scriptInsertIndex = this.script.findIndex(x => x === "{}");
        }
    }

    getScript(): string {
        return this.script.map(input => {
            if (typeof input === 'string') { //not a input
                return input;
            }
            else {
                if (input.type === CommandInputTypes.bool) return input.value;
                return input.value ? "-" + input.name + " " + input.value : "";
            }
        }).join(' ');
    }
    
}

export class PowershellCommandInput{

    value: string;
    
    constructor(
        public name: string,
        public type: CommandInputTypes,
        public options: string[] = []
    ) { }
}

export enum CommandInputTypes {
    string,
    number,
    enum,
    bool,
}