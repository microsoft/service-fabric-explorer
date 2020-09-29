import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {

  constructor() { }

  trackActionEvent(name: string, source: string, data: any) {
    console.log('track event');
    // TODO
  }

}
