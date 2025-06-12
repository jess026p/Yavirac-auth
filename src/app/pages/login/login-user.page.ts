import { Component, OnInit, ViewChild } from '@angular/core';
import { IonicModule, ToastController, LoadingController, AlertController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter, take } from 'rxjs/operators';
import { TerminosModalComponent } from './terminos-modal.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Preferences } from '@capacitor/preferences';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

@Component({
  selector: 'app-login-user',
  templateUrl: './login-user.page.html',
  styleUrls: ['./login-user.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class LoginUserPage implements OnInit {
  username: string = '';
  password: string = '';
  loading: boolean = false;
  rememberMe: boolean = false;
  acceptTerms: boolean = false;
  biometricAvailable: boolean = false;
  biometricAuthEnabled: boolean = true;

  termsHtml: string = `
    <strong>INSTITUTO SUPERIOR TECNOLÓGICO DE TURISMO Y PATRIMONIO YAVIRAC</strong><br>
    Dirección: García Moreno S4-35, Quito, Ecuador, Pichincha Province 593<br><br>
    <strong>1. Responsable del Tratamiento de Datos</strong><br>
    El responsable del tratamiento de sus datos personales es el INSTITUTO SUPERIOR TECNOLÓGICO DE TURISMO Y PATRIMONIO YAVIRAC.<br><br>
    <strong>2. Finalidad del Tratamiento</strong><br>
    Los datos personales que usted proporciona a través de este sistema serán utilizados para:<br>
    - Registrar y gestionar su asistencia.<br>
    - Registrar y validar su ubicación geográfica para fines de control de asistencia.<br>
    - Cumplir con obligaciones legales y contractuales.<br><br>
    <strong>3. Datos que se recopilan</strong><br>
    - Nombre, apellidos, correo electrónico, número de identificación.<br>
    - Ubicación geográfica (latitud y longitud) al momento de marcar asistencia.<br>
    - Horarios y registros de entrada y salida.<br><br>
    <strong>4. Base legal</strong><br>
    El tratamiento de sus datos se realiza en cumplimiento de la Ley Orgánica de Protección de Datos Personales y demás normativa aplicable.<br><br>
    <strong>5. Conservación de los datos</strong><br>
    Sus datos serán conservados mientras dure la relación académica/laboral y durante el tiempo necesario para cumplir con obligaciones legales.<br><br>
    <strong>6. Derechos del titular</strong><br>
    Usted puede ejercer sus derechos de acceso, rectificación, actualización, eliminación y oposición al tratamiento de sus datos personales enviando una solicitud a la administración del Instituto.<br><br>
    <strong>7. Seguridad</strong><br>
    Se han implementado medidas técnicas y organizativas para proteger sus datos personales contra pérdida, acceso no autorizado o uso indebido.<br><br>
    <strong>8. Aceptación</strong><br>
    Al marcar la casilla de aceptación, usted declara haber leído y comprendido estos términos y condiciones y la política de privacidad, y consiente el tratamiento de sus datos personales para los fines indicados.<br>
  `;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    // Eliminar la redirección automática si hay sesión activa
    // if (this.authService.isAuthenticated()) {
    //   this.router.navigate(['/home/inicio']);
    // }
    const creds = await Preferences.get({ key: 'biometricUser' });
    this.biometricAvailable = !!creds.value;
    const bioAuth = await Preferences.get({ key: 'biometricAuth' });
    this.biometricAuthEnabled = bioAuth.value === null ? true : bioAuth.value === 'true';
  }

  async ionViewWillEnter() {
    const creds = await Preferences.get({ key: 'biometricUser' });
    this.biometricAvailable = !!creds.value;
    const bioAuth = await Preferences.get({ key: 'biometricAuth' });
    this.biometricAuthEnabled = bioAuth.value === null ? true : bioAuth.value === 'true';
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }

  async showLoading(message: string = 'Iniciando sesión...') {
    const loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  async showTermsModal() {
    const modal = await this.modalCtrl.create({
      component: TerminosModalComponent,
      cssClass: 'terms-modal',
      showBackdrop: true
    });
    await modal.present();
  }

  async login() {
    if (!this.username || !this.password) {
      await this.showToast('Por favor ingrese usuario y contraseña', 'warning');
      return;
    }

    const loading = await this.showLoading();
    this.loading = true;

    try {
      const response = await this.authService.login({
        username: this.username,
        password: this.password
      });

      const user = this.authService.getUser();
      if (!user.terminosAceptados) {
        await loading.dismiss();
        await this.mostrarYGestionarTerminos(user);
        return;
      }
      // Guardar credenciales para login biométrico
      await Preferences.set({ key: 'biometricUser', value: JSON.stringify({ username: this.username, password: this.password }) });
      this.biometricAvailable = true;
      // Asegura que si la biometría estaba desactivada y el usuario inicia sesión, se respete la preferencia
      const bioAuth = await Preferences.get({ key: 'biometricAuth' });
      this.biometricAuthEnabled = bioAuth.value === null ? true : bioAuth.value === 'true';
      await this.showToast(`¡Bienvenido, ${user?.name || this.username}!`);
      window.location.href = '/home/inicio';
    } catch (error: any) {
      let message = 'Error al iniciar sesión';
      if (error.error?.message) {
        message = error.error.message;
      } else if (error.message) {
        message = error.message;
      }
      await this.showToast(message, 'danger');
    } finally {
      this.loading = false;
      await loading.dismiss();
    }
  }

  async mostrarYGestionarTerminos(user: any) {
    if (user.terminosAceptados) return; // No mostrar si ya aceptó
    const modal = await this.modalCtrl.create({
      component: TerminosModalComponent,
      cssClass: 'terms-modal',
      backdropDismiss: false // No permitir cerrar sin aceptar
    });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    // Solo continuar si aceptó
    if (role !== 'aceptar') {
      await this.showToast('Debe aceptar los términos para continuar', 'danger');
      return;
    }
    try {
      await this.http.patch(`${environment.apiUrl}/users/${user.id}/aceptar-terminos`, {}).toPromise();
      // Vuelve a hacer login para obtener el usuario actualizado
      await this.authService.login({ username: this.username, password: this.password });
      const updatedUser = this.authService.getUser();
      if (updatedUser.terminosAceptados) {
        await this.showToast('Términos y condiciones aceptados');
        window.location.href = '/home/inicio';
      } else {
        await this.showToast('Error al aceptar los términos. Intente de nuevo.', 'danger');
      }
    } catch (e) {
      await this.showToast('Error al aceptar los términos. Intente de nuevo.', 'danger');
    }
  }

  async loginWithBiometric() {
    try {
      // Verifica si hay credenciales guardadas
      const creds = await Preferences.get({ key: 'biometricUser' });
      if (!creds.value) {
        await this.showToast('Primero inicia sesión con usuario y contraseña', 'warning');
        return;
      }
      const { username, password } = JSON.parse(creds.value);
      // Verifica si hay biometry disponible
      const check = await BiometricAuth.checkBiometry();
      if (!check.isAvailable) {
        await this.showToast('La autenticación biométrica no está disponible', 'warning');
        return;
      }
      // Solicita autenticación biométrica
      const result: any = await BiometricAuth.authenticate({
        reason: 'Autentícate con tu huella digital para ingresar'
      });
      if (result && result.verified) {
        // Login automático con las credenciales guardadas
        const loading = await this.showLoading('Iniciando sesión...');
        this.loading = true;
        try {
          await this.authService.login({ username, password });
          const user = this.authService.getUser();
          if (!user.terminosAceptados) {
            await loading.dismiss();
            await this.mostrarYGestionarTerminos(user);
            return;
          }
          await this.showToast(`¡Bienvenido, ${user?.name || username}!`);
          window.location.href = '/home/inicio';
        } catch (error: any) {
          let message = 'Error al iniciar sesión';
          if (error.error?.message) {
            message = error.error.message;
          } else if (error.message) {
            message = error.message;
          }
          await this.showToast(message, 'danger');
        } finally {
          this.loading = false;
          await loading.dismiss();
        }
      } else {
        await this.showToast('Autenticación biométrica fallida', 'danger');
      }
    } catch (error) {
      await this.showToast('Error en autenticación biométrica', 'danger');
    }
  }
} 