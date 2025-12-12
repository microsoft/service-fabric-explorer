import { InfrastructureDoc } from 'src/app/Models/DataModels/InfrastructureDoc';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { InfrastructureDocCollection } from 'src/app/Models/DataModels/collections/InfrastructureDocCollection';
import { get } from 'cypress/types/lodash';

@Component({
  selector: 'app-infrastructure-docs',
  templateUrl: './Infrastructure-docs.component.html',
  styleUrls: ['./Infrastructure-docs.component.scss']
})
export class InfrastructureDocsComponent  {
  @Input() DocCollection: InfrastructureDocCollection;
  selectedInfrastructureService: any ="None" ;

  JsonParsedDocument(doc: InfrastructureDoc): any {
    return typeof doc.raw === 'string' ? JSON.parse(doc.raw) : doc.raw;
  }
}
