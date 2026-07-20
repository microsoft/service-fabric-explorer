import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { interval } from 'rxjs';

@Component({
    selector: 'app-local-time',
    templateUrl: './local-time.component.html',
    styleUrls: ['./local-time.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class LocalTimeComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  utcTime = '';

  ngOnInit(): void {
    interval(1000).subscribe(() => this.setTime());
  }

  setTime() {
    const currentDate = new Date();
    currentDate.setMilliseconds(0);
    this.utcTime = currentDate.toISOString();
    this.cdr.detectChanges();
  }
}
