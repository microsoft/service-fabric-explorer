import { InfrastructureDoc } from 'src/app/Models/DataModels/InfrastructureDoc';
import { Component, Input } from '@angular/core';
import { InfrastructureDocumentCollection } from 'src/app/Models/DataModels/collections/InfrastructureDocCollection';

@Component({
  selector: 'app-infrastructure-docss',
  templateUrl: './infrastructure-docss.component.html',
  styleUrls: ['./infrastructure-docss.component.scss']
})
export class infrastructureDocssComponent  {
  @Input() infrastructureDocumentCollection: InfrastructureDocumentCollection;
  selectedInfrastructureService: any = "None" ;

  JsonParsedDocument(doc: InfrastructureDoc): any {
    return typeof doc.raw === 'string' ? JSON.parse(doc.raw) : doc.raw;
  }
}
