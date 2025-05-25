import { TestBed } from '@angular/core/testing';

import { ClientPassagerService } from './client-passager.service';

describe('ClientPassagerService', () => {
  let service: ClientPassagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientPassagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
