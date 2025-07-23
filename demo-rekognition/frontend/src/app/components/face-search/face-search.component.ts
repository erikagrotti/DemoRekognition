import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RekognitionService, Photo, SearchResult } from '../../services/rekognition.service';

@Component({
  selector: 'app-face-search',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './face-search.component.html',
  styleUrl: './face-search.component.scss'
})
export class FaceSearchComponent {
  referencePhotoUrl: string | null = null;
  referencePhotoFile: File | null = null;
  searchResults: SearchResult | null = null;
  searching = false;
  isDragOver = false;

  constructor(private rekognitionService: RekognitionService) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  processFile(file: File) {
    this.referencePhotoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.referencePhotoUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearReference() {
    this.referencePhotoUrl = null;
    this.referencePhotoFile = null;
    this.searchResults = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
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
          <p style="margin: 4px 0; color: #666;"><strong>Data:</strong> ${new Date(photo.uploadDate).toLocaleDateString('pt-BR')}</p>
          <p style="margin: 4px 0; color: #666;"><strong>Faces detectadas:</strong> ${photo.faces?.length || 0}</p>
        </div>
      </div>
    `;
    
    const newWindow = window.open('', '_blank', 'width=700,height=800,scrollbars=yes,resizable=yes');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Detalhes da Foto</title>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #fff; }
            img { max-width: 100%; height: auto; }
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

  searchPhotos() {
    if (!this.referencePhotoFile) return;

    this.searching = true;
    this.rekognitionService.searchPhotosByPerson(this.referencePhotoFile).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.searching = false;
      },
      error: () => this.searching = false
    });
  }
}