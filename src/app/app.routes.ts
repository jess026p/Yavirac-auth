import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'login-user',
    loadComponent: () => import('./pages/login/login-user.page').then(m => m.LoginUserPage)
  },
  {
    path: 'login-screen',
    loadComponent: () => import('./pages/login-screen/login-screen.page').then(m => m.LoginScreenPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },
      {
        path: 'inicio',
        loadComponent: () => import('./home/inicio/inicio.page').then(m => m.InicioPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'perfil',
        loadComponent: () => import('./home/perfil/perfil.page').then(m => m.PerfilPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'notificaciones',
        loadComponent: () => import('./home/notificaciones/notificaciones.page').then(m => m.NotificacionesPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'ajustes',
        loadComponent: () => import('./home/ajustes/ajustes.page').then(m => m.AjustesPage),
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
