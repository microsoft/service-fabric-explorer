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
        return this.script.map(_ => typeof _ === 'string' ? _ : _.value).join(' ');
    }
    
}

export interface PowershellCommandInput{

    name: string;
    value: string;
    options: string[];
    type: CommandInputTypes
}

export enum CommandInputTypes {
    open,
    fixed,
    bool
}