import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  constructor(
    private http: HttpClient,
    private storage: Storage
  ) {}

  async marcarAsistencia(payload: any) {
    const token = await this.storage.get('token');
    return this.http.post(`${environment.apiUrl}/asistencias/marcar`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).toPromise();
  }

  async obtenerAsistencias(userId: string) {
    const token = await this.storage.get('token');
    return this.http.get(`${environment.apiUrl}/asistencias/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).toPromise();
  }

  async obtenerAsistenciaPorFecha(userId: string, fecha: string) {
    const token = await this.storage.get('token');
    return this.http.get(`${environment.apiUrl}/asistencias/user/${userId}/fecha/${fecha}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).toPromise();
  }
} 