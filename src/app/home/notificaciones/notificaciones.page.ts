import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ IMPORTAR ESTO
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
  imports: [CommonModule, IonicModule] // ✅ AGREGAR CommonModule AQUÍ
})
export class NotificacionesPage {
  notificaciones = [
    { fecha: '2025-03-11', mensaje: '✅ Asistencia registrada con éxito a las 08:00 AM' },
    { fecha: '2025-03-10', mensaje: '❌ No se pudo marcar asistencia. Ubicación incorrecta.' },
    { fecha: '2025-03-09', mensaje: '⚠️ Activar huella digital para confirmar asistencia.' }
  ];
}
