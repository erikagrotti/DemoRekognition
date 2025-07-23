import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RekognitionService, Photo } from '../../services/rekognition.service';
import { AuthService } from '../../auth/service/auth.service';

@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './photo-gallery.component.html',
  styleUrl: './photo-gallery.component.scss'
})
export class PhotoGalleryComponent implements OnInit {
  photos: Photo[] = [];
  loading = false;
  isAdmin = false;

  constructor(
    private rekognitionService: RekognitionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPhotos();
    this.isAdmin = this.authService.isAdmin();
  }

  loadPhotos() {
    this.loading = true;
    this.rekognitionService.getAllPhotos().subscribe({
      next: (photos) => {
        console.log('Photos received:', photos);
        this.photos = photos;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading photos:', error);
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadPhotos(files);
    }
  }

  uploadPhotos(files: FileList) {
    this.loading = true;
    const uploadPromises = Array.from(files).map(file => 
      this.rekognitionService.uploadPhoto(file).toPromise()
    );

    Promise.all(uploadPromises).then(() => {
      this.loadPhotos();
    }).catch(() => this.loading = false);
  }

  trackByPhotoId(index: number, photo: Photo): string {
    return photo.id;
  }

  viewPhoto(photo: Photo) {
    const modalContent = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <img src="${photo.url}" style="width: 100%; border-radius: 12px; margin-bottom: 16px;" alt="Foto">
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #333;">Detalhes da Foto</h3>
          <p style="margin: 4px 0; color: #666;"><strong>ID:</strong> ${photo.id}</p>
          <p style="margin: 4px 0; color: #666;"><strong>Data de Upload:</strong> ${new Date(photo.uploadDate).toLocaleDateString('pt-BR', { 
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}</p>
          <p style="margin: 4px 0; color: #666;"><strong>Faces detectadas:</strong> ${photo.faces?.length || 0}</p>
          ${photo.faces && photo.faces.length > 0 ? 
            `<p style="margin: 4px 0; color: #666;"><strong>Reconhecimento:</strong> Ativo</p>` : 
            `<p style="margin: 4px 0; color: #999;"><strong>Reconhecimento:</strong> Nenhuma face detectada</p>`
          }
        </div>
      </div>
    `;
    
    const newWindow = window.open('', '_blank', 'width=700,height=800,scrollbars=yes,resizable=yes');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Detalhes da Foto - ${photo.id}</title>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #fff; }
            img { max-width: 100%; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          ${modalContent}
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  }

  deletePhoto(photoId: string) {
    this.rekognitionService.deletePhoto(photoId).subscribe({
      next: () => {
        this.photos = this.photos.filter(p => p.id !== photoId);
      }
    });
  }
  
  onImageError(event: any, photo: Photo) {
    console.error('Image failed to load:', photo.url, photo);
  }
  
  onImageLoad(photo: Photo) {
    console.log('Image loaded successfully:', photo.url);
  }
}