import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Constants } from '../Common/Constants';
import { Observable, interval, Subscription, forkJoin, timer, of, Subject } from 'rxjs';
import { catchError, take, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RefreshService {
  public isRefreshing = false;
  public refreshRate = '';
  private autoRefreshInterval: Observable<any> = null;
  public refreshSubject: Subject<number> = new Subject();
  private currentSync: Subscription;
  private previousRefreshSetting = 0;
  public refreshTick = 0; // used to test how many refreshes have been performed

  constructor(private storage: StorageService) { }

  public init(): void {
    const defaultRefreshInterval = this.storage.getValueNumber(
        Constants.AutoRefreshIntervalStorageKey, Constants.DefaultAutoRefreshInterval);

        this.updateRefreshInterval(defaultRefreshInterval.toString(), true /* no refresh */);
    }

  public refreshAll(): void {
    this.refreshSubject.next(this.refreshTick);
    this.refreshTick++;
    this.isRefreshing = true;

    try {
            // Rotate the refreshing icon for at least 1 second
            timer(1000).subscribe( () => this.isRefreshing = false);
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
