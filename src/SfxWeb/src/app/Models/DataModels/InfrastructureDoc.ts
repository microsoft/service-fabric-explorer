// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { IRawInfrastructureDocument } from '../RawDataTypes';
import { DataModelBase } from './Base';
import { DataService } from 'src/app/services/data.service';

export class InfrastructureDoc extends DataModelBase<IRawInfrastructureDocument> {
    constructor(public dataService: DataService, public raw: IRawInfrastructureDocument) {
        super(dataService, raw);
    }
}
