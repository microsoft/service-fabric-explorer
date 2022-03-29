import {  IAuthOption, IHTTPRequestTransformer } from "../httpHandler";

export class AuthenticationManager {
    public authOptions: IAuthOption[] = [];

    registerAuthOption(option: IAuthOption) {
        this.authOptions.push(option);
    }

    getHttpHandlerTransform(authType: string): IHTTPRequestTransformer {
        const auth = this.authOptions.find(option => option.id === authType);

        if(!auth) {
            throw new Error(`${authType} is not a registered authorization option`)
        }

        return auth.getHandler();
    }
}