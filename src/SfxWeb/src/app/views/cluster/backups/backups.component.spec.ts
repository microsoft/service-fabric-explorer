import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BackupsComponent } from './backups.component';

describe('BackupsComponent', () => {
  let component: BackupsComponent;
  let fixture: ComponentFixture<BackupsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BackupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
