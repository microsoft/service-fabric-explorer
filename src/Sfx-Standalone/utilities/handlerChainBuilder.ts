//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import { IHandlerChainBuilder, IAsyncHandlerConstructor } from "sfx.common";

import * as utils from "donuts.node/utils";

export class HandlerChainBuilder<THandler extends Donuts.FunctionType> implements IHandlerChainBuilder<THandler> {
    private readonly chain: Array<IAsyncHandlerConstructor<THandler>> = [];

    public async handleAsync(constructor: IAsyncHandlerConstructor<THandler>): Promise<IHandlerChainBuilder<THandler>> {
        if (!utils.isFunction(constructor)) {
            throw new Error("constructor should be a function.");
        }

        this.chain.push(constructor);

        return this;
    }

    public async buildAsync(): Promise<THandler> {
        let constructor: IAsyncHandlerConstructor<THandler>;
        let nextHandler: THandler = undefined;

        while (constructor = this.chain.pop()) {
            nextHandler = await constructor(nextHandler);

            if (!utils.isNullOrUndefined(nextHandler) && !utils.isFunction(nextHandler)) {
                throw new Error("Contructed handler must be a function.");
            }
        }

        return nextHandler;
    }
}
