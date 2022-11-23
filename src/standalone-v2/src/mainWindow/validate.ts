export interface ValidateProperty {
    propertyPath: string;
    validators: validateFunction[];
    required?: boolean;
    failQuickly?: boolean;
}

export type validateFunction = (item:any) => string[];

export interface ValidationError {
    index: string;
    errors: string[];
}

export function validate(item: any, validators: ValidateProperty[]): string[] {
    let errors: string[] = [];

    validators.forEach(validator => {
        //TODO fix
        const propertyValue = item[validator.propertyPath];
        console.log(validator.propertyPath, propertyValue)
        let failed = false;
        if((propertyValue === null || propertyValue === undefined)) {
            if(validator.required) {
                errors.push(`${validator.propertyPath} is required`);
                failed = true;
            }
        }else{
            validator.validators.forEach(validate => {
                if(!failed) {
                    const validationErrors = validate(propertyValue);
    
                    if(validationErrors.length > 0) {
                        errors = errors.concat(validate(propertyValue).map(error => `${validator.propertyPath} ${error}`));            
                        
                        if(validator.failQuickly) {
                            failed = true;
                        }
                    }
                }
            })    
        }
    })

    return errors;
}

export const isRequired: validateFunction = (item) => {
    return (item === null || item === undefined) ? ["is required"] : [];
}

export const isString: validateFunction = (item) => {
    return typeof item !== "string" ? ["must be a string."] : [];
}

export const minLength = (length: number): validateFunction => {
    return (item) => {
        return item?.length > length ? [] : ['is not long enough']
    }
}

export const endsWith = (ending: string): validateFunction => {
    return (item: string) => {
        return item.endsWith(ending) ? [] : [`must end with ${ending}`]
    }
}

export const isUrl: validateFunction = (url) => {
    if(!(url.startsWith("http://") || url.startsWith("https://"))) {
        return ["url must start with http:// or https://"]
    }

    return [];
}

//The compare function should expect the single property for a and the whole object for b.

export const isUnique = (getter: () => any[], compare: (a: any,b: any) => boolean): validateFunction => {
    return (item) => {
        const allItems = getter();
        return allItems.filter((item2: any) => compare(item, item2)).length > 1 ? ['must be unique']: [];
    }
}