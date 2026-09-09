import { TestBed } from '@angular/core/testing';
import { BarChartComponent } from './bar-chart.component';

describe('BarChartComponent', () => {
  it('renders inputs on first mount and removes multiple stale series', () => {
    TestBed.configureTestingModule({ declarations: [BarChartComponent] });
    const fixture = TestBed.createComponent(BarChartComponent);
    fixture.componentRef.setInput('xAxisCategories', ['node-1']);
    fixture.componentRef.setInput('title', 'Node metrics');
    fixture.componentRef.setInput('dataSet', [{ label: 'Load', data: [5] }, { label: 'Other', data: [2] }]);
    fixture.detectChanges();
    const chart = fixture.componentInstance['chart'];
    expect(chart.series.length).toBe(2);
    expect(chart.series[0].points[0].y).toBe(5);
    expect(chart.xAxis[0].categories).toEqual(['node-1']);
    fixture.componentRef.setInput('dataSet', []);
    fixture.detectChanges();
    expect(chart.series.length).toBe(0);
    fixture.destroy();
  });
});
