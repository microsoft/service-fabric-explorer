import { Component, OnInit } from '@angular/core';
import { IRawFMMLocation } from 'src/app/Models/RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';

@Component({
  selector: 'app-fmm-location',
  templateUrl: './fmm-location.component.html',
  styleUrls: ['./fmm-location.component.scss']
})
export class FmmLocationComponent implements OnInit {
  fmmLocation: IRawFMMLocation = {} as IRawFMMLocation;
  isLoading = true;
  
  constructor(private restClientService: RestClientService) {}

  ngOnInit(): void {
    this.getFMMLocation();
  }

  getFMMLocation(): void {
    this.isLoading = true;
    this.restClientService.getFMMLocation().subscribe({
      next: (data) => {
        this.fmmLocation = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}