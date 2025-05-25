import { TestBed } from '@angular/core/testing';

import { PanierclientService } from './panierclient.service';

describe('PanierclientService', () => {
  let service: PanierclientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PanierclientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
