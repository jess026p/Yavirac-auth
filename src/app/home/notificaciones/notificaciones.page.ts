import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ IMPORTAR ESTO
import { IonicModule } from '@ionic/angular';
import { NotificacionesService } from '../../services/notificaciones.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
  imports: [CommonModule, IonicModule] // ✅ AGREGAR CommonModule AQUÍ
})
export class NotificacionesPage implements OnInit, OnDestroy {
  notificaciones: any[] = [];
  loading = false;
  private intervalo: any;

  constructor(
    private notificacionesService: NotificacionesService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.cargarNotificaciones();
    this.intervalo = setInterval(() => this.cargarNotificaciones(), 30000); // cada 30 segundos
  }

  ngOnDestroy() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  async cargarNotificaciones() {
    this.loading = true;
    const user = this.authService.getUser();
    if (!user || !user.id) {
      this.notificaciones = [];
      this.loading = false;
      return;
    }
    try {
      const resp = await this.notificacionesService.obtenerNotificaciones(user.id).toPromise();
      const notifs = Array.isArray(resp) ? resp : (resp?.data ?? []);
      // Asegura que cada notificación tenga un tipo
      this.notificaciones = notifs.map((n: any) => ({ ...n, tipo: n.tipo || 'info' }));
      console.log('Notificaciones:', this.notificaciones);
    } catch (e) {
      this.notificaciones = [];
    }
    this.loading = false;
  }

  getIcono(tipo: string) {
    switch (tipo) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'notifications';
    }
  }

  getColor(tipo: string) {
    switch (tipo) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'primary';
      default: return 'medium';
    }
  }
}
