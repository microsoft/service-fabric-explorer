import { InfrastructureDoc } from 'src/app/Models/DataModels/InfrastructureDoc';
import { Component, Input } from '@angular/core';
import { InfrastructureDocumentCollection } from 'src/app/Models/DataModels/collections/InfrastructureDocCollection';

@Component({
  selector: 'app-infrastructure-docs',
  templateUrl: './Infrastructure-docs.component.html',
  styleUrls: ['./Infrastructure-docs.component.scss']
})
export class InfrastructureDocsComponent  {
  @Input() infrastructureDocumentCollection: InfrastructureDocumentCollection;
  selectedInfrastructureService: any = "None" ;

  JsonParsedDocument(doc: InfrastructureDoc): any {
    return typeof doc.raw === 'string' ? JSON.parse(doc.raw) : doc.raw;
  }
}
