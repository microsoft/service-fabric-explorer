import { ListColumnSetting } from '../Models/ListSettings';

export interface DetailBaseComponent {
    listSetting: ListColumnSetting;
    item: any;
    cache?: Record<string, any>;
}
