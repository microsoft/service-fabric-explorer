import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Constants } from '../Common/Constants';
import { Observable, interval, Subscription, forkJoin, timer, of } from 'rxjs';
import { catchError, take, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RefreshService {
  public isRefreshing = false;
  public refreshRate = '';
  private autoRefreshInterval: Observable<any> = null;
  private currentSync: Subscription;
  private previousRefreshSetting = 0;

  private refreshSubjects: (() => Observable<any>)[] = [];
  private _refreshSubjectsMap: Record<string, () => Observable<any>> = {};

  constructor(private storage: StorageService) { }

  public init(): void {
    const defaultRefreshInterval = this.storage.getValueNumber(
        Constants.AutoRefreshIntervalStorageKey, Constants.DefaultAutoRefreshInterval);

    this.updateRefreshInterval(defaultRefreshInterval.toString(), true /* no refresh */);
  }

  public insertRefreshSubject(key: string, func: () => Observable<any> ) {
    if (key in this._refreshSubjectsMap) {
      return;
    }

    this._refreshSubjectsMap[key] = func;
    this.refreshSubjects.push(func);
  }

  public removeRefreshSubject(key: string) {
    if (key in this._refreshSubjectsMap) {
      this.refreshSubjects = this.refreshSubjects.filter( subject => subject !== this._refreshSubjectsMap[key]);
      delete this._refreshSubjectsMap[key];
    }
  }

  public hasRefreshSubject(key: string): boolean {
    return key in this._refreshSubjectsMap;
  }

  public refreshSubjectCount(): number{
    return this.refreshSubjects.length;
  }

  public refreshAll(): void {

      const refreshStartedTime = Date.now();
      this.isRefreshing = true;

      const subs = this.refreshSubjects.map(observeFunction => {
         return observeFunction().pipe(take(1), catchError(err => of(null)));
      });

      try {
        forkJoin(subs).pipe(
          finalize(() => {
            // Rotate the refreshing icon for at least 1 second
            const remainingTime = Math.max(1000 - (Date.now() - refreshStartedTime), 0);
            timer(remainingTime).subscribe( () => this.isRefreshing = false);
          })
        ).subscribe();
      } catch {
        this.isRefreshing = false;
      }

  }

  public updateRefreshInterval(newValue: string, noRefresh: boolean = false): void {
      this.storage.setValue(Constants.AutoRefreshIntervalStorageKey, newValue);

      // remove existing auto refresh observable
      if (this.autoRefreshInterval) {
          this.currentSync.unsubscribe();
          this.autoRefreshInterval = null;
      }

      const newInterval: number = parseInt(newValue, 10);
      this.refreshRate = newValue;

      if (newInterval > 0 ) {
          console.log('Auto refresh interval = ' + newInterval + ' seconds');
          this.autoRefreshInterval =  interval(newInterval * 1000);
          this.currentSync = this.autoRefreshInterval.subscribe( () => this.refreshAll());
          if (!noRefresh && (this.previousRefreshSetting === 0 || newInterval < this.previousRefreshSetting)) {
              this.refreshAll();
          }
      }

      this.previousRefreshSetting = newInterval;
  }
}
