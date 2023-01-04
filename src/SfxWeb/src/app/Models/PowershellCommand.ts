export class PowershellCommand{


    constructor(public name: string,
        public referenceUrl: string,
        public safetyLevel: CommandSafetyLevel,
        public prefix: string,
        public parameters: PowershellCommandParameter[] = [],
        public adminOnly: boolean = false) {
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
            else if (param.type === CommandParamTypes.bool) {
                value = '$True'; //potential edge case with required bool param using default value of $True
            }
            else if (param.type === CommandParamTypes.string) {
                value = `"${param.value}"`;
            }
            else value = param.value.toString();
     
            return { name, value };
        })
    }
    
    getScript(): string {

        let script = '';
        const displayedParams = this.paramsToStringArr();

        if (this.safetyLevel === CommandSafetyLevel.dangerous) {
            script = '#';
        }
        script = `${script}${this.prefix} ` + displayedParams.map(param => {
            if (!param.name) {
                return param.value;
            }
            return `${param.name} ${param.value}`;
        }).join(' ');
        
        return script;
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
        if (optionalParams?.options) {
            this.options = optionalParams.options;
        }
        if (optionalParams?.required) {
            this.required = optionalParams.required;
        }
        if (optionalParams?.allowCustomValAndOptions) {
            this.allowCustomValAndOptions = optionalParams.allowCustomValAndOptions;
        }
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
    bool
}

export enum CommandSafetyLevel {
    safe = 'safe',
    unsafe = 'unsafe',
    dangerous = 'danger'
}

export class CommandFactory {
    //----factory methods----
    static GenTimeoutSecParam(): PowershellCommandParameter {
        return new PowershellCommandParameter("TimeoutSec", CommandParamTypes.number);
    }

    static GenSendHealthReport(typeName: string, param: string = ''): PowershellCommand {
        const healthState = new PowershellCommandParameter("HealthState", CommandParamTypes.enum, { options: ["OK", "Warning", "Error"], required: true });
        const sourceId = new PowershellCommandParameter("SourceId", CommandParamTypes.string, { required: true });
        const healthProperty = new PowershellCommandParameter("HealthProperty", CommandParamTypes.string, {required: true});
        const description = new PowershellCommandParameter("Description", CommandParamTypes.string);
        const ttl = new PowershellCommandParameter("TimeToLiveSec", CommandParamTypes.number);
        const removeWhenExpired = new PowershellCommandParameter("RemoveWhenExpired", CommandParamTypes.switch)
        const sequenceNum = new PowershellCommandParameter("SequenceNumber", CommandParamTypes.number);
        const immediate = new PowershellCommandParameter("Immediate", CommandParamTypes.switch);
        
        return new PowershellCommand(
        'Send Health Report',
        `https://docs.microsoft.com/powershell/module/servicefabric/send-servicefabric${typeName.toLowerCase()}healthreport`,
        CommandSafetyLevel.unsafe,
        `Send-ServiceFabric${typeName}HealthReport ${param}`,
            [healthState, sourceId, healthProperty, description, ttl, removeWhenExpired, sequenceNum, immediate, CommandFactory.GenTimeoutSecParam()],
        true
        );
    }

    static GenHealthFilterParam(typeName: string): PowershellCommandParameter {
        return new PowershellCommandParameter(
            `${typeName}Filter`,
            CommandParamTypes.enum,
            { options: ["Default", "None", "Ok", "Warning", "Error", "All"], allowCustomValAndOptions: true }
        );

    }

    static GenIgnoreConstraintsParam() : PowershellCommandParameter {
        return new PowershellCommandParameter('IgnoreConstraints', CommandParamTypes.bool);
    }

    static GenNodeListParam(paramName: string, nodes: string[]): PowershellCommandParameter {
        return new PowershellCommandParameter(paramName, CommandParamTypes.string,
        { required: true, options: nodes, allowCustomValAndOptions: true });
    }

}