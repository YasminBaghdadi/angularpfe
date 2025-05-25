import { TestBed } from '@angular/core/testing';

import { AccueilpanierService } from './accueilpanier.service';

describe('AccueilpanierService', () => {
  let service: AccueilpanierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccueilpanierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
