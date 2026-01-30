import { Component, OnInit } from '@angular/core';
import { IRawFailoverManagerManagerInformation } from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';

@Component({
  selector: 'app-fmm-info',
  templateUrl: './fmm-info.component.html',
  styleUrls: ['./fmm-info.component.scss']
})
export class FailoverManagerManagerInformationComponent implements OnInit {
  fmmInfo: IRawFailoverManagerManagerInformation = {} as IRawFailoverManagerManagerInformation;
  isLoading = true;
  isFmmEstimate = false;
  
  constructor(private restClientService: RestClientService) {}

  ngOnInit(): void {
    this.getFailoverManagerManagerInformation();
  }

  getFailoverManagerManagerInformation(): void {
    this.isLoading = true;
    this.restClientService.getFailoverManagerManagerInformation().subscribe({
      next: (data) => {
        this.fmmInfo = data;
        this.isLoading = false;
      },
      error: () => {
        this.estimateFmmNode();
      }
    });
  }

  private estimateFmmNode(): void {
    this.restClientService.getNodes().subscribe({
      next: (nodes) => {
        if (nodes && nodes.length > 0) {
          // FMM is on the up node with the lowest node ID
          const upNodes = nodes.filter(node => node.NodeStatus === "Up");
          
          if (upNodes.length > 0) {
            let lowest = upNodes[0];
            
            upNodes.forEach(node => {
              if (parseInt(lowest.Id.Id, 16) > parseInt(node.Id.Id, 16)) {
                lowest = node;
              }
            });

            if (lowest) {
              this.fmmInfo = {
                NodeName: lowest.Name,
                NodeId: lowest.Id,
                NodeInstanceId: lowest.InstanceId
              };
              this.isFmmEstimate = true;
            }
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}