import { IRawInfrastructureDocument } from '../RawDataTypes';
import { DataModelBase } from './Base';
import { DataService } from 'src/app/services/data.service';

export class InfrastructureDoc extends DataModelBase<IRawInfrastructureDocument> {
    constructor(public dataService: DataService, public raw: IRawInfrastructureDocument) {
        super(dataService, raw);
    }
}
