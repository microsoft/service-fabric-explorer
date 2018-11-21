//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export class MessageService implements IMessageReceiver {
        private messageReceiver: IMessageReceiver;

        public registerMessageReceiver(messageReceiver: IMessageReceiver): MessageService {
            this.messageReceiver = messageReceiver;
            return this;
        }

        public showMessage(message: string, severity: MessageSeverity, durationMs?: number) {
            if (this.messageReceiver) {
                this.messageReceiver.showMessage(message, severity, durationMs);
            }
        }
    }

    export class MessageController implements IMessageReceiver {
        public messages: IMessage[] = [];

        constructor(message: MessageService, private $interval: angular.IIntervalService) {
            message.registerMessageReceiver(this);
        }

        public showMessage(message: string, severity: MessageSeverity, durationMs?: number) {
            for (let i = 0; i < this.messages.length; i++) {
                if (this.messages[i].message === message) {
                    return;
                }
            }

            let duration: number = durationMs | 10000;
            this.messages.push({
                message: message,
                severity: severity,
                removeTimeout: this.$interval(() => this.removeMsg(message), duration, 1)
            });
        }

        public removeMsg(message: string) {
            for (let i = 0; i < this.messages.length; i++) {
                if (this.messages[i].message === message) {
                    this.$interval.cancel(this.messages[i].removeTimeout);
                    this.messages.splice(i, 1);
                    return;
                }
            }
        }
    }

    export interface IMessageReceiver {
        showMessage(message: string, severity: MessageSeverity, durationMs?: number);
    }

    export enum MessageSeverity {
        Info, Warn, Err
    }

    export interface IMessage {
        message: string;
        severity: MessageSeverity;
        removeTimeout: angular.IPromise<any>;
    }

    (function () {

        let module = angular.module("messages", []);
        module.factory("message", () => new MessageService());
        module.controller("MessageController", ["message", "$interval", MessageController]);
    })();
}
