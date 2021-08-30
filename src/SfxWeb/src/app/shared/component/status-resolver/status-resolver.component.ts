import { Component, Input, OnInit } from '@angular/core';
import { NodeStatusConstants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-status-resolver',
  templateUrl: './status-resolver.component.html',
  styleUrls: ['./status-resolver.component.scss']
})
export class StatusResolverComponent implements OnInit {

  @Input() status: string;


  statusIconResolver: Record<string, string> = {};

  constructor() { }

  ngOnInit(): void {
    this.statusIconResolver.Active = 'mif-arrow-up green-resolve';
    this.statusIconResolver.Ready = 'mif-arrow-up green-resolve';

    this.statusIconResolver[NodeStatusConstants.Up] = 'mif-arrow-up green-resolve';
    this.statusIconResolver[NodeStatusConstants.Down] = 'mif-arrow-down red-resolve';
    this.statusIconResolver[NodeStatusConstants.Disabled] = 'mif-blocked orange-resolve';
    this.statusIconResolver[NodeStatusConstants.Disabling] = 'mif-blocked orange-resolve';
    this.statusIconResolver[NodeStatusConstants.Unknown] = '';
  }

}
