import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrastructureJobTileComponent } from './infrastructure-job-tile.component';

describe('InfrastructureJobTileComponent', () => {
  let component: InfrastructureJobTileComponent;
  let fixture: ComponentFixture<InfrastructureJobTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfrastructureJobTileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfrastructureJobTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
