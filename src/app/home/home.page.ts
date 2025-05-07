import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTabs, IonRouterOutlet, IonHeader, IonToolbar, IonAvatar, IonButton } from '@ionic/angular/standalone';
import { homeOutline, personOutline, notificationsOutline, settingsOutline, personCircleOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, IonContent, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTabs, IonRouterOutlet, IonHeader, IonToolbar, IonAvatar, IonButton, RouterLink, RouterLinkActive],
})
export class HomePage {
  icons = {
    home: homeOutline,
    perfil: personOutline,
    notificaciones: notificationsOutline,
    ajustes: settingsOutline,
  };

  user$ = this.authService.user$;

  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
