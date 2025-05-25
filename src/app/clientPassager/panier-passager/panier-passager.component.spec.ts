import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanierPassagerComponent } from './panier-passager.component';

describe('PanierPassagerComponent', () => {
  let component: PanierPassagerComponent;
  let fixture: ComponentFixture<PanierPassagerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PanierPassagerComponent]
    });
    fixture = TestBed.createComponent(PanierPassagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
