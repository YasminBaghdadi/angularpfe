import { TestBed } from '@angular/core/testing';

import { ProfilreservationService } from './profilreservation.service';

describe('ProfilreservationService', () => {
  let service: ProfilreservationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfilreservationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
