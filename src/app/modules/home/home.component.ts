import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  private token: string = 'your-token-here'; // Replace with actual token

  constructor(private http: HttpClient) {}

  private async getDireccion(lat: number, lng: number): Promise<string> {
    try {
      const url = `${environment.apiUrl}/geocoding/reverse?lat=${lat}&lon=${lng}`;
      const response = await firstValueFrom(
        this.http.get<any>(url, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
      );
      
      console.log('Respuesta del backend:', response);
      
      if (response && response.display_name) {
        return response.display_name;
      }
      return 'No disponible';
    } catch (error) {
      console.error('Error al obtener la dirección:', error);
      return 'No disponible';
    }
  }
} 