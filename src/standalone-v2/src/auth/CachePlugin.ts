/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TokenCacheContext } from '@azure/msal-node';
import * as fs from 'fs';

const getCacheLocation = (client: string) => `./cache-${client}.json`;

const getBeforeCacheAccess = (clientId: string) => {
    return async (cacheContext: TokenCacheContext) => {
        if(fs.existsSync(getCacheLocation(clientId))) {
            const data = await fs.promises.readFile(getCacheLocation(clientId), 'utf-8');
            cacheContext.tokenCache.deserialize(data);
        }else{
            try {
                await fs.promises.writeFile(getCacheLocation(clientId), cacheContext.tokenCache.serialize())
            }catch(e) {
                console.log(e)
            }
        }
    };
}

const getAfterCacheAccess = (clientId: string) => {
    return async (cacheContext: TokenCacheContext) => {
        if(cacheContext.cacheHasChanged){
            try {
                await fs.promises.writeFile(getCacheLocation(clientId), cacheContext.tokenCache.serialize())
            } catch(error) {
                console.log(error)
            }
        }
    };
}

export const cachePlugin = (clientId: string) => {
    return {
        beforeCacheAccess: getBeforeCacheAccess(clientId),
        afterCacheAccess: getAfterCacheAccess(clientId)
    }
}
