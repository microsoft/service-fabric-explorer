import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AadMetadata } from 'src/app/Models/DataModels/Aad';
import { IRawAadMetadata } from 'src/app/Models/RawDataTypes';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AadConfigService {

  public aadEnabled = false;
  public metaData: AadMetadata;
  public http: HttpClient;

  constructor(private readonly httpHandler: HttpBackend) {
    this.http = new HttpClient(httpHandler);
  }

   init(): Promise<boolean> {
     return new Promise( (resolve, reject) => {
      this.getAADmetadata().subscribe(data => {
        this.metaData = data;

        if (data.isAadAuthType){
          this.aadEnabled = true;
        }
        resolve(true);
      });
     });
  }

  public getAADmetadata(): Observable<AadMetadata> {
    return this.http.get<IRawAadMetadata>(environment.baseUrl + '/$/GetAadMetadata/?api-version=6.0').pipe(map(data => new AadMetadata(data)));
  }

  public getCluster() {
    return this.metaData.metadata.cluster || '';
  }

  public getAuthority() {
    return this.metaData.metadata.authority || '';
  }
}
