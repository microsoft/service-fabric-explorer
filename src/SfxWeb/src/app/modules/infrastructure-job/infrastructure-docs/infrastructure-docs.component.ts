// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { InfrastructureDoc } from 'src/app/Models/DataModels/InfrastructureDoc';
import { Component, Input } from '@angular/core';
import { InfrastructureDocumentCollection } from 'src/app/Models/DataModels/collections/InfrastructureDocCollection';

@Component({
  selector: 'app-infrastructure-docs',
  templateUrl: './infrastructure-docs.component.html',
  styleUrls: ['./infrastructure-docs.component.scss']
})
export class InfrastructureDocsComponent  {
  @Input() infrastructureDocumentCollection: InfrastructureDocumentCollection;
  selectedInfrastructureService: any = "None" ;

  JsonParsedDocument(doc: InfrastructureDoc): any {
    return typeof doc.raw === 'string' ? JSON.parse(doc.raw) : doc.raw;
  }
}
