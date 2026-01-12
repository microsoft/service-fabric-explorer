// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripPrefix'
})
export class StripPrefixPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    return value.replace(`fabric:/System/InfrastructureService/` ,'');
  }

}
