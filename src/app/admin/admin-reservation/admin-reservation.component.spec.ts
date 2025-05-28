import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminReservationComponent } from './admin-reservation.component';

describe('AdminReservationComponent', () => {
  let component: AdminReservationComponent;
  let fixture: ComponentFixture<AdminReservationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminReservationComponent]
    });
    fixture = TestBed.createComponent(AdminReservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
