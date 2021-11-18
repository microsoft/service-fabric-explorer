import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { HealthStateConstants, NodeStatusConstants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-status-resolver',
  templateUrl: './status-resolver.component.html',
  styleUrls: ['./status-resolver.component.scss']
})
export class StatusResolverComponent implements  OnInit, OnChanges {

  @Input() status: string;
  @Input() healthState: HealthStateConstants;
  @Input() showText = true;

  statusIconResolver: Record<string, string> = {};

  displayClass = '';

  constructor() { }

  ngOnInit(): void {
    this.statusIconResolver.Active = 'mif-arrow-up green';
    this.statusIconResolver.Ready = 'mif-arrow-up green';

    this.statusIconResolver[NodeStatusConstants.Up] = 'mif-arrow-up green';
    this.statusIconResolver[NodeStatusConstants.Down] = 'mif-arrow-down red-resolver';
    this.statusIconResolver[NodeStatusConstants.Disabled] = 'mif-blocked orange';
    this.statusIconResolver[NodeStatusConstants.Disabling] = 'mif-blocked orange';
    this.statusIconResolver[NodeStatusConstants.Unknown] = '';
    this.displayClass = this.statusIconResolver[this.status];

  }

  ngOnChanges() {
    if (this?.healthState === HealthStateConstants.Warning && this.status === NodeStatusConstants.Up ) {
      this.displayClass = 'mif-arrow-up orange';
    }else if (this?.healthState === HealthStateConstants.Error && this.status === NodeStatusConstants.Up ) {
      this.displayClass = 'mif-arrow-up red-resolver';
    } else {
      this.displayClass = this.statusIconResolver[this.status];
    }

  }
}
