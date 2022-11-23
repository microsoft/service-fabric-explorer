import { validate } from "../mainWindow/validate";
import {  IAuthOption, IHttpHandler } from "../httpHandler";
import { Subject } from 'rxjs';

export class AuthenticationManager {
    public authOptions: IAuthOption[] = [];
    public authOptionsChanges = new Subject<IAuthOption[]>();

    registerAuthOption(option: IAuthOption) {
        this.authOptions.push(option);
        this.authOptionsChanges.next(this.authOptions);
    }

    getHttpHandler(authType: string): IHttpHandler {
        const auth = this.authOptions.find(option => option.id === authType);

        if(!auth) {
            //TODO find a way to surface errors.
            throw new Error(`${authType} is not a registered authorization option`)
        }

        return auth.getHandler();
    }

    validateConfiguration(authType: string, data: any): string[] {
        const auth = this.authOptions.find(option => option.id === authType);

        if(!auth) {
            return [`The authentication type provided is not valid : ${authType}. If this type is provided by an extension, check it initialized succesfully`]
        }

        return validate(data, auth.validators);
    }
}