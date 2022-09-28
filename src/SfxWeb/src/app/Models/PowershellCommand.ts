export class PowershellCommand{

    private script: (string | PowershellCommandInput)[]

    constructor(public name: string,
        public referenceUrl: string,
        public safetyLevel: CommandSafetyLevel,
        rawScript: string,
        public inputs: PowershellCommandInput[] = []) {

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
                if (!input.value) return "";
                const parameter = "-" + input.name + " ";
                
                if (input.type === CommandInputTypes.bool) return parameter;
                if (input.type === CommandInputTypes.string) return parameter + `"${input.value}"`;
                
                return parameter + input.value;
            }
        }).join(' ');
    }
    
}

export class PowershellCommandInput{

    value: string | boolean = "";
    options: string[] = [];
    required: boolean = false;
    
    constructor(
        public name: string,
        public type: CommandInputTypes,
        optionalParams?: OptionalInputParams
    ) { 
        if (optionalParams?.options) this.options = optionalParams.options;
        if (optionalParams?.required) this.required = optionalParams.required;

        if (this.type === CommandInputTypes.bool) this.value = false;
    }
}

interface OptionalInputParams {
    options?: string[],
    required?: boolean
}

export enum CommandInputTypes {
    string,
    number,
    enum,
    bool,
}

export enum CommandSafetyLevel {
    safe,
    unsafe,
    dangerous
}