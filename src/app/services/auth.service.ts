import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/v1/auth';

  constructor(private http: HttpClient) {}

  async login(credentials: { username: string; password: string }): Promise<any> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/login`, credentials).toPromise();
      if (response && response.data && response.data.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.auth));
        return response;
      } else {
        throw new Error('Respuesta de login inválida');
      }
    } catch (error) {
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // exp está en segundos desde epoch
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > now;
    } catch (e) {
      // Si el token no es válido o no se puede decodificar
      return false;
    }
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  async changePasswordFirstTime(userId: string, newPassword: string): Promise<any> {
    try {
      const response: any = await this.http.put(`${this.apiUrl}/${userId}/change-password-first`, {
        passwordNew: newPassword
      }).toPromise();
      
      // Actualizar el usuario en localStorage
      if (response && response.data) {
        const currentUser = this.getUser();
        if (currentUser) {
          currentUser.passwordChanged = true;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
}
