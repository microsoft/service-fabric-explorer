import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClipBoardComponent } from './clip-board.component';

describe('ClipBoardComponent', () => {
  let component: ClipBoardComponent;
  let fixture: ComponentFixture<ClipBoardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ClipBoardComponent ]
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
});
