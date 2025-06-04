import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  constructor(private http: HttpClient) {}

  async marcarAsistencia(payload: any) {
    const token = localStorage.getItem('token');
    return this.http.post(`${environment.apiUrl}/asistencias/marcar`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).toPromise();
  }

  async obtenerAsistencias(userId: string) {
    const token = localStorage.getItem('token');
    return this.http.get(`${environment.apiUrl}/asistencias/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).toPromise();
  }

  async obtenerAsistenciaPorFecha(userId: string, fecha: string) {
    const token = localStorage.getItem('token');
    return this.http.get(`${environment.apiUrl}/asistencias/user/${userId}/fecha/${fecha}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).toPromise();
  }
} 