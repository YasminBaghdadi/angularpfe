import { TestBed } from '@angular/core/testing';

import { DashcommandeService } from './dashcommande.service';

describe('DashcommandeService', () => {
  let service: DashcommandeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashcommandeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
