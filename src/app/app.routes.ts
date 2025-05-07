import { Routes } from '@angular/router';
import { HomePage } from './home/home.page';
import { InicioPage } from './home/inicio/inicio.page';
import { PerfilPage } from './home/perfil/perfil.page';
import { NotificacionesPage } from './home/notificaciones/notificaciones.page';
import { AjustesPage } from './home/ajustes/ajustes.page';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',  // 🔹 Redirige por defecto a la pantalla de login
    pathMatch: 'full',
  },

  // 📌 Ruta para la pantalla de Login y Registro
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'login-screen',
    loadComponent: () => import('./pages/login-screen/login-screen.page').then((m) => m.LoginScreenPage),
  },
  {
    path: 'login-user',
    loadComponent: () => import('./pages/login/login-user.page').then(m => m.LoginUserPage),
  },

  // 📌 Ruta para la página principal con tabs
  {
    path: 'home',
    canActivate: [AuthGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    children: [
      { path: 'inicio', loadComponent: () => import('./home/inicio/inicio.page').then(m => m.InicioPage) },
      { path: 'perfil', loadComponent: () => import('./home/perfil/perfil.page').then(m => m.PerfilPage) },
      { path: 'notificaciones', loadComponent: () => import('./home/notificaciones/notificaciones.page').then(m => m.NotificacionesPage) },
      { path: 'ajustes', loadComponent: () => import('./home/ajustes/ajustes.page').then(m => m.AjustesPage) },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }, // Redirigir a inicio si no hay ruta
    ],
  },

];
