export class PowershellCommand{


    constructor(public name: string,
        public referenceUrl: string,
        public safetyLevel: CommandSafetyLevel,
        public prefix: string,
        public parameters: PowershellCommandParameter[] = []) {
    }

    //used to easily display value and name of the parameter seperately
    paramsToStringArr(): {name: string, value:string}[] {
        return this.parameters.filter(param => param.value || param.value === 0).map(param => {
            let name = '-' + param.name;
            let value: string;
          
            if (param.type === CommandParamTypes.switch) {
                value = name;
                name = '';
            } 
            else if (param.type === CommandParamTypes.bool) value = '$True'; //potential edge case with required bool param using default value of $True
            else if (param.type === CommandParamTypes.string) value = '"' + param.value + '"';
            else if (param.type === CommandParamTypes.object) value = '$' + param.value;
            else value = param.value.toString();
     
            return { name, value };
        })
    }
    
    getScript(): string {
        
        const displayedParams = this.paramsToStringArr();

        return this.prefix + ' ' + displayedParams.map(param => {
            if (!param.name) return param.value;
            return param.name + ' ' + param.value;
        }).join(' ');
        
    }
    
}

export class PowershellCommandParameter{

    value?: string | boolean | number;
    options: string[] = [];
    required: boolean = false;
    allowCustomValAndOptions: boolean = false; //have some predefined options, but user can also enter their own value
    
    constructor(
        public name: string,
        public type: CommandParamTypes,
        optionalParams?: OptionalCommandParamParams
    ) { 
        if (optionalParams?.options) this.options = optionalParams.options;
        if (optionalParams?.required) this.required = optionalParams.required;
        if (optionalParams?.allowCustomValAndOptions) this.allowCustomValAndOptions = optionalParams.allowCustomValAndOptions;

    }
}

interface OptionalCommandParamParams {
    options?: string[],
    required?: boolean,
    allowCustomValAndOptions?: boolean
}

export enum CommandParamTypes {
    string,
    number,
    enum,
    switch,
    bool,
    object
}

export enum CommandSafetyLevel {
    safe = 'safe',
    unsafe = 'unsafe',
    dangerous = 'danger'
}