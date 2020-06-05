import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Constants } from '../Common/Constants';
import { Observable, interval, Subscription, forkJoin, timer, of } from 'rxjs';
import { catchError, tap, take, finalize } from 'rxjs/operators';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class RefreshService {
  public isRefreshing: boolean = false;
  public refreshRate = "";
  private autoRefreshInterval: Observable<any> = null;
  private currentSync: Subscription;
  private previousRefreshSetting = 0;

  private refreshSubjects: { (): Observable<any>; } [] = [];
  private _refreshSubjectsMap: Record<string, { (): Observable<any>; }> = {}; 

  constructor(private storage: StorageService,
              private toastService: MessageService) { }

  public init(): void {
    let defaultRefreshInterval = this.storage.getValueNumber(
        Constants.AutoRefreshIntervalStorageKey, Constants.DefaultAutoRefreshInterval);

    this.updateRefreshInterval(defaultRefreshInterval.toString(), true /* no refresh */);
  }

  public insertRefreshSubject(key: string, func: {(): Observable<any>} ) {
    if(key in this._refreshSubjectsMap) {
      return
    }

    this._refreshSubjectsMap[key] = func;
    this.refreshSubjects.push(func)
  }

  public removeRefreshSubject(key: string) {
    if(key in this._refreshSubjectsMap) {
      this.refreshSubjects = this.refreshSubjects.filter( subject => subject !== this._refreshSubjectsMap[key]) 
      delete this._refreshSubjectsMap[key];
    }
  }

  public refreshAll(): void {
      if (this.isRefreshing) {
          return;
      }

      let refreshStartedTime = Date.now();
      this.isRefreshing = true;
      
      const subs =  this.refreshSubjects.map(observeFunction => {
         return observeFunction().pipe(take(1), catchError(err => {console.log(err); return of(err)})); 
      })

      try {
        forkJoin(subs).pipe(
          catchError(err => of(err)),

        ).subscribe(() => {
          // Rotate the refreshing icon for at least 1 second
          let remainingTime = Math.max(1000 - (Date.now() - refreshStartedTime), 0);
          timer(remainingTime).subscribe( () => this.isRefreshing = false);
        })
      } catch {
        this.isRefreshing = false;
      }

  }

  public updateRefreshInterval(newValue: string, noRefresh: boolean = false): void {
      this.storage.setValue(Constants.AutoRefreshIntervalStorageKey, newValue)

      if (this.autoRefreshInterval) {
          this.currentSync.unsubscribe();
          this.autoRefreshInterval = null;
      }

      let newInterval: number = parseInt(newValue, 10);
      this.refreshRate = newValue;

      if (newInterval === 0) {
          console.log("Turned off auto refresh");
      } else {
          console.log("Auto refresh interval = " + newInterval + " seconds");
          this.autoRefreshInterval =  interval(newInterval * 1000)  //this.$interval(() => this.refreshAll(), newInterval * 1000);
          this.currentSync = this.autoRefreshInterval.subscribe( () => this.refreshAll());
          if (!noRefresh && (this.previousRefreshSetting === 0 || newInterval < this.previousRefreshSetting)) {
              this.refreshAll();
          }
      }

      this.previousRefreshSetting = newInterval;
  }
}
