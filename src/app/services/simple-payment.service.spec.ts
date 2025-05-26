import { TestBed } from '@angular/core/testing';

import { SimplePaymentService } from './simple-payment.service';

describe('SimplePaymentService', () => {
  let service: SimplePaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimplePaymentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
