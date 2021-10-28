import { Pipe, PipeTransform, TrackByFunction } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';

@Pipe({
  name: 'customTrackBy'
})
export class CustomTrackByPipe implements PipeTransform {
  transform(item: any): TrackByFunction<any> {
    return (index: number, setting: ListColumnSetting) => {
      return (setting.getValue(item) || index).toString() + setting.displayName;
    };
  }
}
