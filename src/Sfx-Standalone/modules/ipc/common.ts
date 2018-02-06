//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { ICommunicator, ISender } from "../../@types/ipc";
import "../../utilities/utils";
import error from "../../utilities/errorUtil";

export abstract class Disposable implements IDisposable {
    protected disposed: boolean;

    constructor() {
        this.disposed = false;
    }

    public dispose() {
        if (this.disposed === false) {
            this.disposing();
            this.disposed = true;
        }
    }

    protected validateDisposal(): void {
        if (this.disposed === true) {
            throw error("already disposed.");
        }
    }

    protected abstract disposing(): void;
}

export abstract class Communicator extends Disposable implements ICommunicator {
    public abstract readonly isHost: boolean;

    public abstract readonly id: string;

    protected eventHandlers: IDictionary<Array<(...args: Array<any>) => any>>;

    constructor() {
        super();

        this.eventHandlers = {};
    }

    public on(eventName: string, handler: (...args: Array<any>) => any): void {
        this.validateDisposal();

        if (String.isNullUndefinedOrWhitespace(eventName)) {
            throw error("eventName must be supplied.");
        }

        if (!Function.isFunction(handler)) {
            throw error("handler must be a function.");
        }

        if (this.eventHandlers[eventName] === undefined) {
            this.eventHandlers[eventName] = new Array();
        }

        this.eventHandlers[eventName].push(handler);
    }

    public once(eventName: string, handler: (...args: Array<any>) => any): void {
        this.validateDisposal();

        if (String.isNullUndefinedOrWhitespace(eventName)) {
            throw error("eventName must be supplied.");
        }

        if (!Function.isFunction(handler)) {
            throw error("handler must be a function.");
        }

        let handlerQueue = this.eventHandlers[eventName];

        if (handlerQueue === undefined) {
            this.eventHandlers[eventName] = handlerQueue = new Array();
        }

        const handlerIndex = -1 + handlerQueue.push((data) => {
            handlerQueue[handlerIndex] = handlerQueue[handlerQueue.length - 1];
            handlerQueue.pop();
            
            return handler(data);
        });
    }

    public abstract send<TResult>(eventName: string, ...args: Array<any>): void;

    public removeListener(eventName: string, handler: (...args: Array<any>) => void): void {
        if (String.isNullUndefinedOrWhitespace(eventName)) {
            throw error("eventName must be supplied.");
        }

        if (!Function.isFunction(handler)) {
            throw error("handler must be a function.");
        }

        let handlerQueue = this.eventHandlers[eventName];

        if (handlerQueue !== undefined) {
            const handlerIndex = handlerQueue.indexOf(handler);

            if (handlerIndex >= 0) {
                handlerQueue.splice(handlerIndex, 1);
            }
        }
    }

    protected triggerEvent(eventName: string, responser: ISender, ...args: Array<any>): any {
        if (String.isNullUndefinedOrWhitespace(eventName)) {
            return;
        }

        if (this.eventHandlers[eventName] !== undefined) {
            const handlerQueue = this.eventHandlers[eventName];
            let result: any = undefined;

            for (let handlerIndex = handlerQueue.length - 1; handlerIndex >= 0; handlerIndex--) {
                result = handlerQueue[handlerIndex](responser, ...args);
            }

            return result;
        }
    }

    protected disposing(): void {
        this.eventHandlers = undefined;
    }
}
