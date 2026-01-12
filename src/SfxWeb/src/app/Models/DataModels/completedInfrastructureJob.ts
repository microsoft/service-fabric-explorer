// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { IRawInfrastructureJob, IRawInfraRepairTask, IRawRoleInstanceImpact, InfraRepairTask } from '../RawDataTypes';
import { DataModelBase } from './Base';
import { DataService } from 'src/app/services/data.service';
import { of } from 'rxjs';

export class CompletedInfrastructureJob extends DataModelBase<IRawInfrastructureJob> {

    Id: string;
    ImpactAction: string;

   public get id(): string {
       return this.raw.Id;
   }

   constructor(public dataService: DataService, public raw: IRawInfrastructureJob, private dateRef: Date = new Date()) {
       super(dataService, raw);
       this.updateInternal();
   }

   updateInternal() {
       this.ImpactAction = this.raw.ImpactAction;
       return of(null);
    }
}
