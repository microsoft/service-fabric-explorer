// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Pipe, PipeTransform } from '@angular/core';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

@Pipe({
  name: 'formatDate'
})
export class FormatDatePipe implements PipeTransform {

  transform(value: string | number): string {
    return TimeUtils.getDuration(value);
  }

}
