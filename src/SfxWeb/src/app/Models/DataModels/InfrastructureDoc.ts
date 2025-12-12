import { IDoc } from '../RawDataTypes';
import { DataModelBase } from './Base';
import { DataService } from 'src/app/services/data.service';

export class InfrastructureDoc extends DataModelBase<IDoc> {
    constructor(public dataService: DataService, public raw: IDoc) {
        super(dataService, raw);
    }
}
