import { TestBed } from '@angular/core/testing';

import { ImageplatService } from './imageplat.service';

describe('ImageplatService', () => {
  let service: ImageplatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageplatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
