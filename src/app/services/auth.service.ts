import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

// Asegúrate de instalar @ionic/storage-angular: npm install @ionic/storage-angular

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(Storage) private storage: Storage
  ) {
    this.initStorage();
    this.loadUser();
  }

  async initStorage() {
    await this.storage.create();
  }

  // Iniciar sesión
  async login(credentials: { username: string; password: string }) {
    const response: any = await this.http.post(`${environment.apiUrl}/auth/login`, credentials).toPromise();
    await this.storage.set('token', response.data.accessToken);
    await this.loadUser();
    return response;
  }

  // Cerrar sesión
  async logout() {
    await this.storage.remove('token');
    await this.storage.remove('user');
    this.userSubject.next(null);
  }

  // Cargar el perfil del usuario
  async loadUser() {
    try {
      const token = await this.storage.get('token');
      if (!token) {
        this.userSubject.next(null);
        return;
      }
      const response: any = await this.http.get(`${environment.apiUrl}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).toPromise();
      const user = response.data;
      await this.storage.set('user', user);
      this.userSubject.next(user);
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      this.userSubject.next(null);
    }
  }

  // Verificar si el usuario está autenticado
  async isAuthenticated(): Promise<boolean> {
    const token = await this.storage.get('token');
    return !!token;
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(roleName: string): boolean {
    const user = this.userSubject.value;
    return user?.roles?.some((role: any) => role.name === roleName);
  }
}
