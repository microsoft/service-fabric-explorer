//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import * as utils from "./utils";
import error from "./errorUtil";

export class HandlerChainBuilder<THandler extends Function> implements IHandlerChainBuilder<THandler> {
    private readonly chain: Array<IHandlerConstructor<THandler>> = new Array<IHandlerConstructor<THandler>>();

    public handle(constructor: IHandlerConstructor<THandler>): IHandlerChainBuilder<THandler> {
        if (!Function.isFunction(constructor)) {
            throw error("constructor should be a function.");
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
                throw error("Contructed handler must be a function.");
            }
        }

        return nextHandler;
    }
}
