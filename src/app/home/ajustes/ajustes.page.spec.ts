import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AjustesPage } from './ajustes.page';

describe('AjustesPage', () => {
  let component: AjustesPage;
  let fixture: ComponentFixture<AjustesPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AjustesPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AjustesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
