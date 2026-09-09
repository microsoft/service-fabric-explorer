import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { setOptions } from 'highcharts';

// Set sizes before charts measure labels, including body-level HTML tooltips.
setOptions({
  chart: { style: { fontSize: '15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif' } },
  subtitle: { style: { fontSize: '15px' } },
  xAxis: { labels: { style: { fontSize: '15px' } }, title: { style: { fontSize: '15px' } } },
  yAxis: { labels: { style: { fontSize: '15px' } }, title: { style: { fontSize: '15px' } } },
  legend: { itemStyle: { fontSize: '15px' } },
  tooltip: { style: { fontSize: '15px' } },
  plotOptions: { series: { dataLabels: { style: { fontSize: '15px' } } } }
});

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()], })
  .catch(err => console.error(err));
