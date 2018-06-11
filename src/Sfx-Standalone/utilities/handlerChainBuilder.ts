//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHandlerChainBuilder, IHandlerConstructor } from "sfx.common";

import * as utils from "./utils";

export class HandlerChainBuilder<THandler extends Function> implements IHandlerChainBuilder<THandler> {
    private readonly chain: Array<IHandlerConstructor<THandler>> = new Array<IHandlerConstructor<THandler>>();

    public handle(constructor: IHandlerConstructor<THandler>): IHandlerChainBuilder<THandler> {
        if (!Function.isFunction(constructor)) {
            throw new Error("constructor should be a function.");
        }

        this.chain.push(constructor);

        return this;
    }

    public build(): THandler {
        let constructor: IHandlerConstructor<THandler>;
        let nextHandler: THandler = undefined;

        while (constructor = this.chain.pop()) {
            nextHandler = constructor(nextHandler);

            if (!utils.isNullOrUndefined(nextHandler) && !Function.isFunction(nextHandler)) {
                throw new Error("Contructed handler must be a function.");
            }
        }

        return nextHandler;
    }
}
