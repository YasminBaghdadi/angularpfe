import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimplePaymentCancelComponent } from './simple-payment-cancel.component';

describe('SimplePaymentCancelComponent', () => {
  let component: SimplePaymentCancelComponent;
  let fixture: ComponentFixture<SimplePaymentCancelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SimplePaymentCancelComponent]
    });
    fixture = TestBed.createComponent(SimplePaymentCancelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
