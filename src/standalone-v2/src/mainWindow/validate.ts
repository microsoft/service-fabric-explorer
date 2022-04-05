export interface ValidateProperty {
    propertyPath: string;
    propertyName: string;
    validators: validateFunction[]
}

export type validateFunction = (item:any) => string[];

export interface ValidationError {

}

export function validate(item: any, validators: ValidateProperty[]): string[] {
    let errors: string[] = [];

    validators.forEach(validator => {
        //TODO fix
        const propertyValue = item[validator.propertyPath];

        let validatorErrors: string[] = []
        validator.validators.forEach(validate => {
            const validationErrors = validate(propertyValue);
            errors = errors.concat(validatorErrors);

            if (validationErrors.length > 0) {
                validatorErrors = validationErrors.concat(validationErrors.map(item => `${validator.propertyName} : ${item}`));
            }
        })

        errors = errors.concat(validatorErrors);
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
        return item.length > length ? [] : ['is not long enough']
    }
}

export const isUrl: validateFunction = (url) => {
    if(!(url.startsWith("http://") || url.startsWith("https://"))) {
        return ["url must start with http:// or https://"]
    }

    return [];
}

export const isUnique = (getter: () => any[], compare: (a: any,b: any) => boolean): validateFunction => {
    const allItems = getter();

    return (item) => {
        return allItems.includes( (item2: any) => compare(item, item2)) ? ['must be unique']: [];
    }
}