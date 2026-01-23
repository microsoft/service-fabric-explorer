// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

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
