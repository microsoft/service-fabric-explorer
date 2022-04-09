import {  IAuthOption, IHttpHandler, IHTTPRequestTransformer } from "../httpHandler";

export class AuthenticationManager {
    public authOptions: IAuthOption[] = [];

    registerAuthOption(option: IAuthOption) {
        this.authOptions.push(option);
    }

    getHttpHandler(authType: string): IHttpHandler {
        const auth = this.authOptions.find(option => option.id === authType);

        if(!auth) {
            //TODO find a way to surface errors.
            throw new Error(`${authType} is not a registered authorization option`)
        }

        return auth.getHandler();
    }

    validateConfiguration(data: any) {
        //TODO add proper validation.
    }
}