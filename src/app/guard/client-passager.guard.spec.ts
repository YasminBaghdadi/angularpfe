import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { clientPassagerGuard } from './client-passager.guard';

describe('clientPassagerGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => clientPassagerGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
