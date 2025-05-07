import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonImg
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { fingerPrint } from 'ionicons/icons';
import { registerPlugin } from '@capacitor/core';

const BiometricAuth = registerPlugin('BiometricAuth') as {
  isAvailable(): Promise<{ value: boolean }>;
  verifyIdentity(options: { reason: string }): Promise<{ verified: boolean }>;
};

addIcons({ 'finger-print': fingerPrint });

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.page.html',
  styleUrls: ['./login-screen.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    IonCardContent,
    IonCard,
    IonIcon,
    IonCardTitle,
    IonCardHeader,
    IonImg,
    IonButton
  ]
})
export class LoginScreenPage {

  constructor() {}

  async loginWithFingerprint() {
    const available = await BiometricAuth.isAvailable();

    if (available.value) {
      const result = await BiometricAuth.verifyIdentity({
        reason: "Por favor autentícate con huella digital"
      });

      if (result.verified) {
        console.log('✅ Autenticación exitosa');
        // 👉 Aquí podrías redirigir, o hacer login con el backend
      } else {
        console.log('❌ Autenticación fallida o cancelada');
      }
    } else {
      console.log('❌ Biometría no disponible');
    }
  }
}
