import {  Clipboard } from '@angular/cdk/clipboard';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { ClipBoardComponent } from './clip-board.component';

describe('ClipBoardComponent', () => {
  let component: ClipBoardComponent;
  let fixture: ComponentFixture<ClipBoardComponent>;
  let spy: any;

  beforeEach(waitForAsync(() => {
    spy = jasmine.createSpyObj('Clipboard', ['copy']);

    TestBed.configureTestingModule({
      imports: [NgbTooltipModule],
      declarations: [ ClipBoardComponent ],
      providers: [{provide: Clipboard, useValue: spy}]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClipBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('copy', () => {
    component.copy();
    expect(spy.copy.calls.count()).toBe(1);
  });
});
