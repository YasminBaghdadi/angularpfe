import { TestBed } from '@angular/core/testing';

import { DashlivreurService } from './dashlivreur.service';

describe('DashlivreurService', () => {
  let service: DashlivreurService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashlivreurService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
