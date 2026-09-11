import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataSet } from 'vis-data';
import { DataGroup } from 'vis-timeline';
import { ITimelineItem } from 'src/app/Models/eventstore/timelineGenerators';
import { EventNavigatorComponent } from './event-navigator.component';

describe('EventNavigatorComponent', () => {
  let fixture: ComponentFixture<EventNavigatorComponent>;
  let component: EventNavigatorComponent;
  const start = Date.UTC(2026, 8, 8, 12);
  const end = start + 3600000;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EventNavigatorComponent] }).compileComponents();
    fixture = TestBed.createComponent(EventNavigatorComponent);
    component = fixture.componentInstance;
    component.events = {
      start: new Date(start), end: new Date(end),
      items: new DataSet<ITimelineItem>([
        { id: 0, kind: 'NodeUp', start: start + 60000, content: '', type: 'point', title: '<table><tr><td>NodeName</td><td>: node-1</td></tr></table>' },
        { id: 1, kind: 'NodeUp', start: start + 60000, content: '', type: 'point' },
        { id: 2, kind: 'ClusterUpgradeCompleted', start: start + 120000, end: start + 240000, content: '' }
      ])
    };
    component.ngOnChanges();
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('shows one track per event kind and stacks collisions', () => {
    expect(component.tracks.length).toBe(2);
    const marks = component.tracks[0].marks;
    expect(marks.length).toBe(2);
    expect(marks[1].y - marks[0].y).toBeGreaterThan(28);
    expect(marks[0].width).toBeGreaterThanOrEqual(24);
  });

  it('preserves the viewing window on data refresh', () => {
    component.setWindow(start + 30000, start + 90000);
    component.ngOnChanges();
    expect(component.from).toBe(start + 30000);
    expect(component.to).toBe(start + 90000);
  });

  it('clamps pan and zoom to query bounds', () => {
    component.setWindow(start, end);
    component.pan(-1);
    expect(component.from).toBe(start);
    component.zoom(10);
    expect(component.from).toBe(start);
    expect(component.to).toBe(end);
  });

  it('searches human-readable names and details without mutating the data', () => {
    component.search = 'node-1';
    component.filter();
    expect(component.count).toBe(1);
    expect(component.tracks[0].marks[0].event.id).toBe(0);
    expect(component.events.items!.length).toBe(3);
  });

  it('opens inspector without changing the event table', () => {
    component.inspectEvent.subscribe(() => {});
    const emit = spyOn(component.inspectEvent, 'emit');
    component.select(component.tracks[0].marks[0].event);
    fixture.detectChanges();
    expect(component.selected!.id).toBe(0);
    expect(fixture.nativeElement.querySelector('.inspector').textContent).toContain('node-1');
    expect(emit).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('.text-action').click();
    expect(emit).toHaveBeenCalledWith('0');
  });

  it('extracts nested leaf properties once with their full paths', () => {
    component.events = { items: new DataSet<ITimelineItem>([{ id: 'repair', kind: 'RepairJob', start, content: '', title: '<table><tr><td>Target</td><td><table><tr><td>Kind</td><td>Node</td></tr><tr><td>NodeName</td><td>long-node-name</td></tr></table></td></tr></table>' }]) };
    component.ngOnChanges();
    component.select(component.tracks[0].marks[0].event);
    expect(component.selected!.facts).toEqual([{ name: 'Target / Kind', value: 'Node' }, { name: 'Target / Node Name', value: 'long-node-name' }]);
  });

  it('preserves literal markup in DOM content instead of parsing it again', () => {
    const content = document.createElement('span');
    content.textContent = '<img src=x onerror=alert(1)> & literal text';
    component.events = {
      groups: new DataSet<DataGroup>([{ id: 'literal-group', content }]),
      items: new DataSet<ITimelineItem>([{ id: 'literal', group: 'literal-group', kind: 'NodeUp', start, content: '' }])
    };
    component.ngOnChanges();
    expect(component.tracks[0].marks[0].event.lane).toBe(content.textContent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('decodes HTML string content only once', () => {
    component.events = { items: new DataSet<ITimelineItem>([{ id: 'html', kind: '', start, content: '<b>&lt;node&gt; &amp; text</b>' }]) };
    component.ngOnChanges();
    expect(component.tracks[0].marks[0].event.name).toBe('<node> & text');
  });

  it('applies keyboard navigation only once', () => {
    const span = component.to - component.from;
    fixture.nativeElement.querySelector('.chart').dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }));
    expect(component.to - component.from).toBe(span / 2);
  });

  it('handles missing datasets and zero-duration windows', () => {
    component.events = { start: new Date(start), end: new Date(start) };
    component.ngOnChanges();
    expect(component.count).toBe(0);
    expect(component.to).toBeGreaterThan(component.from);
    expect(component.tracks).toEqual([]);
  });

  it('does not carry selection to a reused ID', () => {
    component.select(component.tracks[0].marks[0].event);
    component.events = { ...component.events, items: new DataSet<ITimelineItem>([{ id: 0, start: end, content: '', kind: 'NodeDown' }]) };
    component.ngOnChanges();
    expect(component.selected).toBeUndefined();
  });
});
