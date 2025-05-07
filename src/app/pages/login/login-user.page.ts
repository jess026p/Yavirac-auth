import { Component } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
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
export class LoginUserPage {
  username: string = '';
  password: string = '';
  loading: boolean = false;

  constructor(private authService: AuthService, private router: Router, private toastCtrl: ToastController) {}

  async showWelcomeToast(name: string) {
    const toast = await this.toastCtrl.create({
      message: `¡Bienvenido, ${name}!`,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    toast.present();
  }

  async login() {
    console.log('Intentando iniciar sesión', this.username, this.password);
    this.loading = true;
    try {
      const response = await this.authService.login({ username: this.username, password: this.password });
      const user = await this.authService.user$.pipe(
        filter(u => !!u),
        take(1)
      ).toPromise();
      this.loading = false;
      this.showWelcomeToast(user?.name || this.username);
      this.router.navigate(['/home']);
    } catch (error) {
      this.loading = false;
      let message = 'Usuario o contraseña incorrectos';
      const err = error as any;
      if (err && err.error && err.error.message) {
        message = err.error.message;
      }
      const toast = await this.toastCtrl.create({
        message,
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      toast.present();
    }
  }
} 