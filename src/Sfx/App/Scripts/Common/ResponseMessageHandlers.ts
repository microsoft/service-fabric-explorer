//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IResponseMessageHandler {
        getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
        getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string;
    }

    export class GetResponseMessageHandler implements IResponseMessageHandler {
        public getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string {
            return null;
        }

        public getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string {
            if (response.status === 404) {
                // By default exclude 404 error for all get requests
                return null;
            }
            return this.getErrorMessageInternal(apiDesc, response);
        }

        protected getErrorMessageInternal(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string {
            let message = `${apiDesc} failed`;
            if (response.data && response.data.Error) {
                message += `.\r\nCode: ${response.data.Error.Code}\r\nMessage: ${response.data.Error.Message}`;
            } else if (response.statusText) {
                message += ` (${response.statusText})`;
            }
            return message;
        }
    }

    export class PostResponseMessageHandler extends GetResponseMessageHandler {
        public getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string {
            return `${apiDesc} started.`;
        }

        public getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string {
            return this.getErrorMessageInternal(apiDesc, response);
        }
    }

    export class SilentResponseMessageHandler implements IResponseMessageHandler {
        public getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string {
            return null;
        }

        public getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string {
            return null;
        }
    }

    export class ResponseMessageHandlers {
        public static getResponseMessageHandler: IResponseMessageHandler = new GetResponseMessageHandler();
        public static postResponseMessageHandler: IResponseMessageHandler = new PostResponseMessageHandler();
        public static putResponseMessageHandler: IResponseMessageHandler = new PostResponseMessageHandler();
        public static silentResponseMessageHandler: IResponseMessageHandler = new SilentResponseMessageHandler();
    }

    export class EventsStoreResponseMessageHandler implements IResponseMessageHandler {
        private innerHandler?: IResponseMessageHandler;
        public constructor(innerHandler?: IResponseMessageHandler) {
            this.innerHandler = innerHandler;
        }

        public getSuccessMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string {
            let handler = this.innerHandler ? this.innerHandler : ResponseMessageHandlers.getResponseMessageHandler;
            return handler.getSuccessMessage(apiDesc, response);
        }

        public getErrorMessage(apiDesc: string, response: ng.IHttpPromiseCallbackArg<any>): string {
            // API is not available on this cluster.
            if (response.status === 400) {
                return "EventsStore is not available on current cluster.";
            }

            let handler = this.innerHandler ? this.innerHandler : ResponseMessageHandlers.getResponseMessageHandler;
            return handler.getErrorMessage(apiDesc, response);
        }
    }
}
