import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimplePaymentSuccessComponent } from './simple-payment-success.component';

describe('SimplePaymentSuccessComponent', () => {
  let component: SimplePaymentSuccessComponent;
  let fixture: ComponentFixture<SimplePaymentSuccessComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SimplePaymentSuccessComponent]
    });
    fixture = TestBed.createComponent(SimplePaymentSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
