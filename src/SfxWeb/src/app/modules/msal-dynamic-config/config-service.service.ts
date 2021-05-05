import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { AadMetadata } from 'src/app/Models/DataModels/Aad';
import { IRawAadMetadata } from 'src/app/Models/RawDataTypes';

@Injectable({
  providedIn: 'root'
})
export class ConfigServiceService {

  public metaData: IRawAadMetadata;
  private http: HttpClient;
  constructor(private readonly httpHandler: HttpBackend) {
    this.http = new HttpClient(httpHandler);
  }


  init(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.http.get("/api/$/GetAadMetadata/?api-version=6.0").pipe(map(res => res))
        .subscribe( (value: IRawAadMetadata) => {
          this.metaData = value;
          resolve(true);
        },
        (error) => {
          reject(error);
        });
    });
  }

}
