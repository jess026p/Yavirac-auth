import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms'; // ✅ IMPORTAR ESTO
import { Preferences } from '@capacitor/preferences';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  imports: [CommonModule, IonicModule, FormsModule] // ✅ AGREGAR FormsModule AQUÍ
})
export class AjustesPage {
  //   biometricAuth: boolean = true; // Por defecto activado
  //   locationEnabled: boolean = false;

  constructor(private router: Router, private toastCtrl: ToastController) {}

  //   async ionViewWillEnter() {
  //     const bioAuth = await Preferences.get({ key: 'biometricAuth' });
  //     const geoAuth = await Preferences.get({ key: 'locationEnabled' });
  //
  //     this.biometricAuth = bioAuth.value === null ? true : bioAuth.value === 'true';
  //     this.locationEnabled = geoAuth.value === null ? true : geoAuth.value === 'true';
  //   }

  //   async toggleBiometricAuth() {
  //     this.biometricAuth = !this.biometricAuth;
  //     await Preferences.set({ key: 'biometricAuth', value: this.biometricAuth ? 'true' : 'false' });
  //     this.agregarNotificacionLocal(
  //       this.biometricAuth
  //         ? 'La autenticación biométrica ha sido activada.'
  //         : 'La autenticación biométrica ha sido desactivada. No podrá marcar asistencia.',
  //       this.biometricAuth ? 'info' : 'warning'
  //     );
  //     if (!this.biometricAuth) {
  //       const toast = await this.toastCtrl.create({
  //         message: 'La autenticación biométrica ha sido desactivada. No podrá marcar asistencia.',
  //         duration: 3000,
  //         color: 'warning',
  //         position: 'top'
  //       });
  //       await toast.present();
  //     }
  //   }

  //   async toggleLocationAuth() {
  //     this.locationEnabled = !this.locationEnabled;
  //     await Preferences.set({ key: 'locationEnabled', value: this.locationEnabled ? 'true' : 'false' });
  //     this.agregarNotificacionLocal(
  //       this.locationEnabled
  //         ? 'La geolocalización ha sido activada.'
  //         : 'La geolocalización ha sido desactivada. No podrá marcar asistencia.',
  //       this.locationEnabled ? 'info' : 'warning'
  //     );
  //     if (!this.locationEnabled) {
  //       const toast = await this.toastCtrl.create({
  //         message: 'La geolocalización ha sido desactivada. No podrá marcar asistencia.',
  //         duration: 3000,
  //         color: 'warning',
  //         position: 'top'
  //       });
  //       await toast.present();
  //     }
  //   }

  //   agregarNotificacionLocal(mensaje: string, tipo: string = 'info') {
  //     const notificaciones = JSON.parse(localStorage.getItem('notificaciones') || '[]');
  //     const now = new Date();
  //     notificaciones.unshift({
  //       mensaje,
  //       tipo,
  //       fecha: now.toLocaleDateString('es-EC'),
  //       hora: now.toLocaleTimeString('es-EC')
  //     });
  //     localStorage.setItem('notificaciones', JSON.stringify(notificaciones));
  //   }

  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}
