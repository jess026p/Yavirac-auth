import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms'; // ✅ IMPORTAR ESTO
import { Preferences } from '@capacitor/preferences';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  imports: [CommonModule, IonicModule, FormsModule] // ✅ AGREGAR FormsModule AQUÍ
})
export class AjustesPage {
  biometricAuth: boolean = false;
  locationEnabled: boolean = false;

  constructor(private router: Router) {}

  async ngOnInit() {
    const bioAuth = await Preferences.get({ key: 'biometricAuth' });
    const geoAuth = await Preferences.get({ key: 'locationEnabled' });

    this.biometricAuth = bioAuth.value === 'true';
    this.locationEnabled = geoAuth.value === 'true';
  }

  async toggleBiometricAuth() {
    this.biometricAuth = !this.biometricAuth;
    await Preferences.set({ key: 'biometricAuth', value: this.biometricAuth ? 'true' : 'false' });
  }

  async toggleLocationAuth() {
    this.locationEnabled = !this.locationEnabled;
    await Preferences.set({ key: 'locationEnabled', value: this.locationEnabled ? 'true' : 'false' });
  }

  cerrarSesion() {
    this.router.navigate(['/login']);
  }
}
