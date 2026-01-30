// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appVisualization]'
})
export class VisualizationDirective {

  public name: string;

  constructor(public viewContainerRef: ViewContainerRef) { }

}
