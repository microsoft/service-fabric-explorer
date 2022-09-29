export class PowershellCommand{


    constructor(public name: string,
        public referenceUrl: string,
        public safetyLevel: CommandSafetyLevel,
        public prefix: string,
        public parameters: PowershellCommandParameter[] = []) {
    }

    getScript(): string {
        
        return this.prefix + " " + this.parameters.map(input => {
            
            if (!input.value) return "";
            const parameter = "-" + input.name + " ";
            
            if (input.type === CommandParamTypes.bool) return parameter;
            if (input.type === CommandParamTypes.string) return parameter + `"${input.value}"`;
            
            return parameter + input.value;
        }).join(' ');
    }
    
}

export class PowershellCommandParameter{

    value: string | boolean = "";
    options: string[] = [];
    required: boolean = false;
    
    constructor(
        public name: string,
        public type: CommandParamTypes,
        optionalParams?: OptionalCommandParamParams
    ) { 
        if (optionalParams?.options) this.options = optionalParams.options;
        if (optionalParams?.required) this.required = optionalParams.required;

        if (this.type === CommandParamTypes.bool) this.value = false;
    }
}

interface OptionalCommandParamParams {
    options?: string[],
    required?: boolean
}

export enum CommandParamTypes {
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