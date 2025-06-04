import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  constructor(private http: HttpClient) {}

  obtenerNotificaciones(userId: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/notificaciones/user/${userId}`);
  }
} 