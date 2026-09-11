import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart, charts, SeriesLineOptions } from 'highcharts';
import { Subject } from 'rxjs';
import { ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { TimeseriesComponent } from './timeseries.component';

describe('TimeseriesComponent experience switching', () => {
  let fixture: ComponentFixture<TimeseriesComponent>;
  let component: TimeseriesComponent;
  const currentChart = (): Chart => charts.find(chart => chart?.container.parentElement === fixture.nativeElement.querySelector('.test-chart'))!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimeseriesComponent],
      providers: [{ provide: SettingsService, useValue: { treeWidth: new Subject<string>() } }]
    }).overrideComponent(TimeseriesComponent, {
      set: { template: '<div #container class="test-chart" style="width: 600px"></div>' }
    }).compileComponents();
    fixture = TestBed.createComponent(TimeseriesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', {
      series: [{ name: 'Latency', xProperty: 'time', yProperty: 'value' }],
      dataSets: [{ name: 'Partition A', values: [{ time: 1000, value: 1 }, { time: 2000, value: 2 }] }],
      listSettings: new ListSettings(100, [], 'timeseries-test', [])
    });
    fixture.componentRef.setInput('modern', true);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('restores Classic legend, height, tooltip and visible series after leaving New', () => {
    const modernChart = currentChart();
    expect(modernChart.options.legend!.enabled).toBeFalse();
    component.toggleSeries('Latency', 'Partition A');
    expect(modernChart.series[0].visible).toBeFalse();
    const destroyed = spyOn(modernChart, 'destroy').and.callThrough();

    fixture.componentRef.setInput('modern', false);
    fixture.detectChanges();

    const classicChart = currentChart();
    expect(destroyed).toHaveBeenCalledTimes(1);
    expect(classicChart).not.toBe(modernChart);
    expect(classicChart.options.legend!.enabled).toBeTrue();
    expect(classicChart.chartHeight).toBe(200);
    expect(classicChart.options.tooltip!.backgroundColor).toBe('none');
    expect(classicChart.series[0].visible).toBeTrue();
    expect(fixture.nativeElement.querySelector('.highcharts-legend-item')).not.toBeNull();

    fixture.componentRef.setInput('modern', true);
    fixture.detectChanges();
    expect(currentChart().options.legend!.enabled).toBeFalse();
    expect(currentChart().chartHeight).toBe(260);
    expect(currentChart().series[0].visible).toBeFalse();
  });

  it('keeps the existing chart and Classic visibility choices on data refresh', () => {
    fixture.componentRef.setInput('modern', false);
    fixture.detectChanges();
    const classicChart = currentChart();
    classicChart.series[0].hide();
    fixture.componentRef.setInput('data', {
      ...component.data,
      dataSets: [{ name: 'Partition A', values: [{ time: 3000, value: 7 }] }]
    });
    fixture.detectChanges();
    expect(currentChart()).toBe(classicChart);
    expect(classicChart.series[0].visible).toBeFalse();
    expect((classicChart.series[0].options as SeriesLineOptions).data!.length).toBe(1);
  });
});
