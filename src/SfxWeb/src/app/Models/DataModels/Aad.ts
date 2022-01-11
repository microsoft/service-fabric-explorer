import { IRawAadMetadata, IRawAadMetadataMetadata } from '../RawDataTypes';
import { DataModelBase } from './Base';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class AuthenticationBootstrapConstants {
    public static AadAuthType = 'aad'; // Currently, this is the only known authentication type.  However, the cluster returns a field that may be used for expandability.
}

export class AadMetadata extends DataModelBase<IRawAadMetadata> {
    public constructor(raw: IRawAadMetadata) {
        super(null, raw);
    }

    public get metadata(): IRawAadMetadataMetadata {
        if (this.raw) {
            return this.raw.metadata;
        }
        return null;
    }

    public get isAadAuthType(): boolean {
        return this.raw && this.raw.type === AuthenticationBootstrapConstants.AadAuthType;
    }
}


