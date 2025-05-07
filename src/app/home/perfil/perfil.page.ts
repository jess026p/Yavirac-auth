import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [CommonModule, IonicModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton]
})
export class PerfilPage {
  userProfileImage: string = 'assets/imagenes/default-profile.png'; // Ruta de imagen de perfil por defecto
  userName: string = 'Usuario Ejemplo';
  userEmail: string = 'usuario@example.com';
  userLocation: string = 'Cargando ubicación...';
  biometricAuth: boolean = false; // Estado de autenticación biométrica

  router = inject(Router);

  constructor() {}

  async ngOnInit() {
    await this.obtenerUbicacion();
  }

  // 🔹 Obtener ubicación actual del usuario
  async obtenerUbicacion() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      this.userLocation = `Lat: ${coordinates.coords.latitude}, Lng: ${coordinates.coords.longitude}`;
    } catch (error) {
      console.error('Error obteniendo la ubicación:', error);
      this.userLocation = 'Ubicación no disponible';
    }
  }

  // 🔹 Método para editar perfil (puede navegar a otra página o abrir modal)
  editarPerfil() {
    console.log('Editar perfil');
    // Puedes redirigir a otra página si tienes una pantalla de edición
    // this.router.navigate(['/home/editar-perfil']);
  }
}
