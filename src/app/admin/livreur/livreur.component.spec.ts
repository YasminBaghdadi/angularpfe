import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivreurComponent } from './livreur.component';

describe('LivreurComponent', () => {
  let component: LivreurComponent;
  let fixture: ComponentFixture<LivreurComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LivreurComponent]
    });
    fixture = TestBed.createComponent(LivreurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
