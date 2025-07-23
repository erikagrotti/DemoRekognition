import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../auth/service/auth.service';
import { PhotoGalleryComponent } from '../photo-gallery/photo-gallery.component';
import { FaceSearchComponent } from '../face-search/face-search.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatToolbarModule,
    MatMenuModule,
    PhotoGalleryComponent,
    FaceSearchComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  userName: string = '';
  userPhoto: string | null = null;
  userGroup: string | null = null;
  showWelcome = true;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.userName = this.authService.getUserName() || 'Usuário';
    this.userPhoto = this.authService.getUserProfilePicture();
    this.userGroup = this.authService.getUserGroup();
  }

  hideWelcome() {
    this.showWelcome = false;
  }

  logout() {
    this.authService.logout();
  }
}