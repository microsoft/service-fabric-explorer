import { IRawInfratructureDoc } from '../RawDataTypes';
import { DataModelBase } from './Base';
import { DataService } from 'src/app/services/data.service';

export class InfrastructureDoc extends DataModelBase<IRawInfratructureDoc> {
    constructor(public dataService: DataService, public raw: IRawInfratructureDoc) {
        super(dataService, raw);
    }
}
