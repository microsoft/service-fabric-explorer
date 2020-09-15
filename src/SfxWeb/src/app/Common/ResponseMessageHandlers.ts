import { HttpResponseBase, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export interface IResponseMessageHandler {
    getSuccessMessage(apiDesc: string, response: HttpResponse<any>): string;
    getErrorMessage(apiDesc: string, response: HttpErrorResponse): string;
}

export class GetResponseMessageHandler implements IResponseMessageHandler {
    public getSuccessMessage(apiDesc: string, response: HttpResponse<any>): string {
        return null;
    }

    public getErrorMessage(apiDesc: string, response: HttpErrorResponse): string {
        if (response.status === 404) {
            // By default exclude 404 error for all get requests
            return null;
        }
        return this.getErrorMessageInternal(apiDesc, response);
    }

    protected getErrorMessageInternal(apiDesc: string, response: HttpErrorResponse): string {
        let message = `${apiDesc} failed`;
        if (response.error.Error.Code && response.error.Error.Message) {
            message += `.\r\nCode: ${response.error.Error.Code}\r\nMessage: ${response.error.Error.Message}`;
        } else if (response.statusText) {
            message += ` (${response.statusText})`;
        }
        return message;
    }
}

export class PostResponseMessageHandler extends GetResponseMessageHandler {
    public getSuccessMessage(apiDesc: string, response: HttpResponse<any>): string {
        return `${apiDesc} started.`;
    }

    public getErrorMessage(apiDesc: string, response: HttpErrorResponse): string {
        return this.getErrorMessageInternal(apiDesc, response);
    }
}

export class PutResponseMessageHandler extends GetResponseMessageHandler {
    public getSuccessMessage(apiDesc: string, response: HttpResponse<any>): string {
        return `${apiDesc}`;
    }

    public getErrorMessage(apiDesc: string, response: HttpErrorResponse): string {
        return this.getErrorMessageInternal(apiDesc, response);
    }
}

export class DeleteResponseMessageHandler extends GetResponseMessageHandler {
    public getSuccessMessage(apiDesc: string, response: HttpResponse<any>): string {
        return `${apiDesc}`;
    }

    public getErrorMessage(apiDesc: string, response: HttpErrorResponse): string {
        return this.getErrorMessageInternal(apiDesc, response);
    }
}

export class SilentResponseMessageHandler implements IResponseMessageHandler {
    public getSuccessMessage(apiDesc: string, response: HttpResponse<any>): string {
        return null;
    }

    public getErrorMessage(apiDesc: string, response: HttpErrorResponse): string {
        return null;
    }
}

export class ResponseMessageHandlers {
    public static getResponseMessageHandler: IResponseMessageHandler = new GetResponseMessageHandler();
    public static postResponseMessageHandler: IResponseMessageHandler = new PostResponseMessageHandler();
    public static putResponseMessageHandler: IResponseMessageHandler = new PostResponseMessageHandler();
    public static silentResponseMessageHandler: IResponseMessageHandler = new SilentResponseMessageHandler();
    public static deleteResponseMessageHandler: IResponseMessageHandler = new DeleteResponseMessageHandler();
}

export class EventsStoreResponseMessageHandler implements IResponseMessageHandler {
    private innerHandler?: IResponseMessageHandler;
    public constructor(innerHandler?: IResponseMessageHandler) {
        this.innerHandler = innerHandler;
    }

    public getSuccessMessage(apiDesc: string, response: HttpResponse<any>): string {
        const handler = this.innerHandler ? this.innerHandler : ResponseMessageHandlers.getResponseMessageHandler;
        return handler.getSuccessMessage(apiDesc, response);
    }

    public getErrorMessage(apiDesc: string, response: HttpErrorResponse): string {
        // API is not available on this cluster.
        if (response.status === 400) {
            return 'Events API is not available on current cluster.';
        }
        // EventStoreService system service is not added (>=6.4).
        if (response.status === 404 && response.statusText === 'FABRIC_E_SERVICE_DOES_NOT_EXIST') {
            return 'EventStore system service is not found, please enable it.';
        }
        // Non-OneBox environment with no azure tables storage configured.
        // We used to return 404 through invoked process, and the service now returns 503.
        if (response.status === 404 || response.status === 503) {
            return 'Events storage is not configured for current cluster.';
        }

        const handler = this.innerHandler ? this.innerHandler : ResponseMessageHandlers.getResponseMessageHandler;
        return handler.getErrorMessage(apiDesc, response);
    }
}

