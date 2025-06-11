import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  peopleOutline,
  mailOutline,
  fingerPrintOutline,
  idCardOutline,
  personCircleOutline,
  logOutOutline,
  checkmarkCircle,
  closeCircle,
  warning,
  informationCircle,
  notifications
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonRouterOutlet
  ],
})
export class AppComponent {
  constructor() {
    addIcons({
      'person-outline': personOutline,
      'people-outline': peopleOutline,
      'mail-outline': mailOutline,
      'finger-print-outline': fingerPrintOutline,
      'id-card-outline': idCardOutline,
      'person-circle-outline': personCircleOutline,
      'log-out-outline': logOutOutline,
      'checkmark-circle': checkmarkCircle,
      'close-circle': closeCircle,
      'warning': warning,
      'information-circle': informationCircle,
      'notifications': notifications
    });
  }
}
