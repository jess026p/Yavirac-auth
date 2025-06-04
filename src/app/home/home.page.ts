import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTabs, IonRouterOutlet, IonHeader, IonToolbar, IonAvatar, IonButton } from '@ionic/angular/standalone';
import { homeOutline, personOutline, notificationsOutline, settingsOutline, personCircleOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { addIcons } from 'ionicons';
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, IonContent, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTabs, IonRouterOutlet, IonHeader, IonToolbar, IonAvatar, IonButton, RouterLink, RouterLinkActive],
})
export class HomePage implements OnInit {
  icons = {
    home: homeOutline,
    notificaciones: notificationsOutline,
    ajustes: settingsOutline,
  };

  user: any = null;

  constructor(private authService: AuthService, private router: Router) {
      addIcons({personCircleOutline,logOutOutline});}

  ngOnInit() {
    this.user = this.authService.getUser();
  }

  getInitials(user: any): string {
    if (!user) return '';
    const name = user.name || '';
    const lastname = user.lastname || '';
    return (name.charAt(0) + (lastname.charAt(0) || '')).toUpperCase();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
