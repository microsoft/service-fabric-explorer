// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { protocol } from 'electron';
import * as path from 'path';

/**
 * AuthCodeListener is the base class from which
 * special CustomFileProtocol and HttpAuthCode inherit
 * their structure and members.
 */
export abstract class AuthCodeListener {
    public host: string;
    /**
     * Constructor
     * @param hostName - A string that represents the host name that should be listened on (i.e. 'msal' or '127.0.0.1')
     */
    constructor(hostName: string) {
        this.host = hostName;
    }

    public abstract start(): Promise<string>;
    public abstract close(): void;
}


/**
 * CustomFileProtocolListener can be instantiated in order
 * to register and unregister a custom file protocol on which
 * MSAL can listen for Auth Code reponses.
 */
export class CustomFileProtocolListener extends AuthCodeListener {
    constructor(hostName: string) {
        super(hostName);
    }

    /**
     * Registers a custom file protocol on which the library will
     * listen for Auth Code response.
     */
     public start(): Promise<string> {
        const codePromise = new Promise<string>((resolve, reject) => {
            protocol.registerStringProtocol(this.host, (req, callback) => {
                const requestUrl = new URL(req.url);
                const authCode = requestUrl.searchParams.get('code');

                (authCode) ? resolve(authCode) : reject(new Error("No code found in URL"));
            });
        });

        return codePromise;
    }

    /**
     * Unregisters a custom file protocol to stop listening for
     * Auth Code response.
     */
    public close() {
        protocol.unregisterProtocol(this.host);
    }
}