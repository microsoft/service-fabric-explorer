import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeDomainProgressComponent } from './upgrade-domain-progress.component';

describe('UpgradeDomainProgressComponent', () => {
  let component: UpgradeDomainProgressComponent;
  let fixture: ComponentFixture<UpgradeDomainProgressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpgradeDomainProgressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradeDomainProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
