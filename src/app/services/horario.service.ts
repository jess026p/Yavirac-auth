import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  constructor(private http: HttpClient) {}

  async getUserLocations(userId: string) {
    const token = localStorage.getItem('token');
    return this.http.get(`${environment.apiUrl}/horarios/user/${userId}/locations`, {
      headers: { Authorization: `Bearer ${token}` }
    }).toPromise();
  }
} 