//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

/// <reference path="./common.d.ts" />

/// <reference path="./module-manager/module-manager.d.ts" />

/// <reference path="./modules/settings/settings.d.ts" />
/// <reference path="./modules/update/update.d.ts" />
/// <reference path="./modules/http/http.d.ts" />
/// <reference path="./modules/cert/cert.d.ts" />
/// <reference path="./modules/browser-window/browser-window.d.ts" />
/// <reference path="./modules/ipc/ipc.d.ts" />
/// <reference path="./modules/logging/logging.d.ts" />
/// <reference path="./modules/prompt/prompt.d.ts" />
/// <reference path="./modules/prompt.input/prompt.input.d.ts" />
/// <reference path="./modules/prompt.select-certificate/prompt.select-certificate.d.ts" />
/// <reference path="./modules/prompt.connect-cluster/prompt.connect-cluster.d.ts" />
/// <reference path="./modules/proxy.object/proxy.object.d.ts" />
/// <reference path="./modules/remoting/remoting.d.ts" />
/// <reference path="./modules/main-window/main-window.d.ts" />
/// <reference path="./modules/package-manager/package-manager.d.ts" />

declare module "sfx" {
    import { IModuleManager } from "sfx.module-manager";

    global {
        const sfxModuleManager: IModuleManager;
        
        interface StringConstructor {
            possibleString(value: any): value is string;
            isString(value: any): value is string;
            isEmpty(value: string): boolean;
            isEmptyOrWhitespace(value: string): boolean;
        }
    
        interface ArrayConstructor {
            isNullUndefinedOrEmpty(value: any): boolean;
        }
    
        interface FunctionConstructor {
            isFunction(value: any): value is Function;
        }
    
        interface Function {
            isObject(value: any): value is object | Object;
    
            /**
             * Check if an object is empty or not. It also checks if the prototype chains are empty (pure empty).
             * @param {object | Object} value The target object to be checked. Error will be thrown if the value is null or undefined.
             * @returns {boolean} True if the object is empty include the prototype chains are also empty. 
             * Otherwise, false.
             */
            isEmpty(value: object | Object): boolean;
    
            /**
             * Check if the value is serializable. 
             * @param {any} value The value to be checked.
             * @param {boolean} [checkDeep=false] Check recursively.
             * @return {boolean} True if the value is serializable for sure. Otherwise, false, 
             * which indicates the value cannot be serialized or cannot be determined whether it can be serialized or not.
             */
            isSerializable(value: any): boolean;
    
            markSerializable(value: any, serializable?: boolean): any;
        }
    
        interface NumberConstructor {
            isNumber(value: any): value is number | Number;
        }
    
        interface SymbolConstructor {
            isSymbol(value: any): value is symbol;
        }
    
        interface Error {
            toJSON?(): any;
        }
    }
}
