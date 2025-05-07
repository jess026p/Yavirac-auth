import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  AlertController
} from '@ionic/angular/standalone';

import { Browser } from '@capacitor/browser';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonIcon,  /* ¡Asegúrate de incluir IonIcon aquí! */
    IonInput,
    IonItem,
    IonLabel
  ]
})
export class RegistroPage {
  constructor(private alertController: AlertController) {}

  async autenticarConHuella() {
    try {
      // Abre el navegador para iniciar la autenticación
      await Browser.open({ url: 'about:blank' });

      // Mostrar alerta para informar al usuario
      this.mostrarAlerta(
        'Autenticación requerida',
        'Coloca tu dedo en el sensor de huella digital para continuar.'
      );

      // Simulación de autenticación exitosa
      setTimeout(() => {
        this.mostrarAlerta('Éxito', 'Autenticación con huella digital exitosa.');
      }, 2000);

    } catch (error) {
      console.error('Error en la autenticación biométrica:', error);
      this.mostrarAlerta('Error', 'Ocurrió un problema con la autenticación.');
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
