import { Component } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-terminos-modal',
  template: `
    <ion-header class="terms-header-fixed">
      <ion-toolbar color="primary" class="terms-toolbar">
        <ion-title>Términos y Condiciones</ion-title>
        <ion-buttons slot="end">
        <ion-button fill="clear" (click)="dismiss()" class="close-btn">
  ✖
</ion-button>

        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding terms-modal-bg">
      <div class="terms-modal-content">
        <strong>INSTITUTO SUPERIOR TECNOLÓGICO DE TURISMO Y PATRIMONIO YAVIRAC</strong><br>
        Dirección: García Moreno S4-35, Quito, Ecuador, Pichincha Province 593<br><br>
        <strong>1. Responsable del Tratamiento de Datos</strong><br>
        El responsable del tratamiento de sus datos personales es el INSTITUTO SUPERIOR TECNOLÓGICO DE TURISMO Y PATRIMONIO YAVIRAC.<br><br>
        <strong>2. Finalidad del Tratamiento</strong><br>
        Los datos personales que usted proporciona a través de este sistema serán utilizados para:<br>
        - Registrar y gestionar su asistencia.<br>
        - Registrar y validar su ubicación geográfica para fines de control de asistencia.<br>
        - Cumplir con obligaciones legales y contractuales.<br><br>
        <strong>3. Datos que se recopilan</strong><br>
        - Nombre, apellidos, correo electrónico, número de identificación.<br>
        - Ubicación geográfica (latitud y longitud) al momento de marcar asistencia.<br>
        - Horarios y registros de entrada y salida.<br><br>
        <strong>4. Base legal</strong><br>
        El tratamiento de sus datos se realiza en cumplimiento de la Ley Orgánica de Protección de Datos Personales y demás normativa aplicable.<br><br>
        <strong>5. Conservación de los datos</strong><br>
        Sus datos serán conservados mientras dure la relación académica/laboral y durante el tiempo necesario para cumplir con obligaciones legales.<br><br>
        <strong>6. Derechos del titular</strong><br>
        Usted puede ejercer sus derechos de acceso, rectificación, actualización, eliminación y oposición al tratamiento de sus datos personales enviando una solicitud a la administración del Instituto.<br><br>
        <strong>7. Seguridad</strong><br>
        Se han implementado medidas técnicas y organizativas para proteger sus datos personales contra pérdida, acceso no autorizado o uso indebido.<br><br>
        <strong>8. Aceptación</strong><br>
        Al marcar la casilla de aceptación, usted declara haber leído y comprendido estos términos y condiciones y la política de privacidad, y consiente el tratamiento de sus datos personales para los fines indicados.<br>
      </div>
      <ion-item lines="none" class="terms-accept-item">
        <ion-checkbox slot="start" [(ngModel)]="acepto" name="acepto"></ion-checkbox>
        <ion-label class="terms-label">Acepto los Términos y Condiciones</ion-label>
      </ion-item>
      <div class="btn-center">
        <ion-button expand="block" color="primary" (click)="aceptar()" [disabled]="!acepto">Aceptar</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .terms-header-fixed {
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .terms-toolbar {
      min-height: 56px;
      --background: #0258ff;
      color: #fff;
      border-radius: 12px 12px 0 0;
    }
    .terms-modal-bg {
      background: #fff;
      border-radius: 0 0 12px 12px;
      padding-top: 0;
      padding-bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      height: 100%;
    }
    .terms-modal-content {
      text-align: left;
      max-height: 95vh;
      min-height: 0;
      overflow-y: auto;
      font-size: 1em;
      color: #222;
      line-height: 1.5;
      padding: 8px 8px 8px 8px;
      background: #fff;
      border-radius: 0 0 12px 12px;
      margin: 0;
      flex: 1 1 auto;
    }
    .terms-accept-item {
      margin-top: 12px;
      margin-bottom: 0;
      --background: transparent;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
    .terms-label {
      font-size: 1em;
      color: #222;
      font-weight: 400;
      margin-left: 8px;
    }
    .btn-center {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-top: 12px;
      margin-bottom: 0;
    }
    ion-button[disabled] {
      opacity: 0.5;
    }
    @media (max-width: 680px) {
      .terms-modal-content {
        font-size: 0.95em;
        padding: 4px 4px 4px 4px;
      }
      .terms-toolbar {
        min-height: 48px;
        padding-left: 6px;
        padding-right: 4px;
      }
      .close-btn {
        font-size: 1.5em;
        height: 32px;
        width: 32px;
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TerminosModalComponent {
  acepto = false;
  constructor(private modalCtrl: ModalController) {}
  aceptar() {
    if (this.acepto) {
      this.modalCtrl.dismiss(null, 'aceptar');
    }
  }
  dismiss() {
    this.modalCtrl.dismiss();
  }
} 