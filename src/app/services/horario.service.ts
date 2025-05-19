import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  constructor(private http: HttpClient, @Inject(Storage) private storage: Storage) {}

  async getUserLocations(userId: string) {
    const token = await this.storage.get('token');
    return this.http.get(`${environment.apiUrl}/horarios/user/${userId}/locations`, {
      headers: { Authorization: `Bearer ${token}` }
    }).toPromise();
  }


} 