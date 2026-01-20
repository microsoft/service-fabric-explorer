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
        this.isLoading = false;
      }
    });
  }
}