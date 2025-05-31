import { TestBed } from '@angular/core/testing';

import { RestaurantChatService } from './restaurant-chat.service';

describe('RestaurantChatService', () => {
  let service: RestaurantChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RestaurantChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
