import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter, take } from 'rxjs/operators';

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

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    // Verificar si hay una sesión activa
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home/inicio']);
    }
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
      await this.showToast(`¡Bienvenido, ${user?.name || this.username}!`);
      this.router.navigate(['/home/inicio']);
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

  async loginWithBiometric() {
    try {
      const available = await this.checkBiometricAvailability();
      if (!available) {
        await this.showToast('La autenticación biométrica no está disponible', 'warning');
        return;
      }

      const loading = await this.showLoading('Verificando identidad...');
      
      const result = await this.verifyBiometric();
      if (result) {
        // Aquí implementarías la lógica para obtener las credenciales guardadas
        // y hacer login automático
        await this.showToast('Autenticación biométrica exitosa');
        this.router.navigate(['/home/inicio']);
      } else {
        await this.showToast('Autenticación biométrica fallida', 'danger');
      }

      await loading.dismiss();
    } catch (error) {
      await this.showToast('Error en autenticación biométrica', 'danger');
    }
  }

  private async checkBiometricAvailability(): Promise<boolean> {
    // Implementar verificación de disponibilidad biométrica
    return false;
  }

  private async verifyBiometric(): Promise<boolean> {
    // Implementar verificación biométrica
    return false;
  }
} 