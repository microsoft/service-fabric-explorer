
export type validateFunction = (item:any) => string[];

export function validate(item: any, validators: validateFunction[]) {

}


export const isRequired: validateFunction = (item) => {
    return (item === null || item === undefined) ? ["is required"] : [];
}

export const isString: validateFunction = (item) => {
    return typeof item !== "string" ? ["must be a string."] : [];
}