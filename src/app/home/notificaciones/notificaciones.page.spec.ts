import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotificacionesPage } from './notificaciones.page';

describe('NotificacionesPage', () => {
  let component: NotificacionesPage;
  let fixture: ComponentFixture<NotificacionesPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NotificacionesPage],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
