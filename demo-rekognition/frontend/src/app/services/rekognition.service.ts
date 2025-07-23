import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Photo {
  id: string;
  url: string;
  uploadDate: Date;
  faces?: Face[];
}

export interface Face {
  faceId: string;
  boundingBox: BoundingBox;
  confidence: number;
}

export interface BoundingBox {
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface SearchResult {
  photos: Photo[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class RekognitionService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private useMockData = false;

  private mockPhotos: Photo[] = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      uploadDate: new Date('2024-01-15'),
      faces: [{ faceId: 'face-1', boundingBox: { width: 0.3, height: 0.4, left: 0.35, top: 0.2 }, confidence: 0.95 }]
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
      uploadDate: new Date('2024-01-16'),
      faces: [{ faceId: 'face-2', boundingBox: { width: 0.25, height: 0.35, left: 0.4, top: 0.25 }, confidence: 0.92 }]
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      uploadDate: new Date('2024-01-17'),
      faces: [{ faceId: 'face-3', boundingBox: { width: 0.28, height: 0.38, left: 0.36, top: 0.18 }, confidence: 0.88 }]
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      uploadDate: new Date('2024-01-18'),
      faces: [{ faceId: 'face-4', boundingBox: { width: 0.32, height: 0.42, left: 0.34, top: 0.22 }, confidence: 0.91 }]
    },
    {
      id: '5',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
      uploadDate: new Date('2024-01-19'),
      faces: [{ faceId: 'face-5', boundingBox: { width: 0.29, height: 0.39, left: 0.35, top: 0.19 }, confidence: 0.94 }]
    },
    {
      id: '6',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
      uploadDate: new Date('2024-01-20'),
      faces: [{ faceId: 'face-6', boundingBox: { width: 0.31, height: 0.41, left: 0.33, top: 0.21 }, confidence: 0.89 }]
    }
  ];

  constructor(private http: HttpClient) {}

  private resizeImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resizedBase64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
        resolve(resizedBase64);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  getAllPhotos(): Observable<Photo[]> {
    if (this.useMockData) {
      return of(this.mockPhotos).pipe(delay(1000));
    }
    return this.http.get<Photo[]>(`${this.apiUrl}/photos`);
  }

  uploadPhoto(file: File): Observable<Photo> {
    if (this.useMockData) {
      const newPhoto: Photo = {
        id: Date.now().toString(),
        url: URL.createObjectURL(file),
        uploadDate: new Date(),
        faces: [{ faceId: `face-${Date.now()}`, boundingBox: { width: 0.3, height: 0.4, left: 0.35, top: 0.2 }, confidence: Math.random() * 0.3 + 0.7 }]
      };
      this.mockPhotos.push(newPhoto);
      return of(newPhoto).pipe(delay(2000));
    }

    return new Observable(observer => {
      this.resizeImage(file).then(base64 => {
        this.http.post<Photo>(`${this.apiUrl}/photos`, { image: base64 })
          .subscribe({
            next: (result) => observer.next(result),
            error: (error) => observer.error(error),
            complete: () => observer.complete()
          });
      }).catch(error => observer.error(error));
    });
  }

  searchPhotosByPerson(photoFile: File): Observable<SearchResult> {
    if (this.useMockData) {
      const shuffled = [...this.mockPhotos].sort(() => 0.5 - Math.random());
      const results = shuffled.slice(0, Math.floor(Math.random() * 3) + 1);
      return of({ photos: results, totalCount: results.length }).pipe(delay(2000));
    }

    return new Observable(observer => {
      this.resizeImage(photoFile).then(base64 => {
        this.http.post<SearchResult>(`${this.apiUrl}/photos/search`, { image: base64 })
          .subscribe({
            next: (result) => observer.next(result),
            error: (error) => observer.error(error),
            complete: () => observer.complete()
          });
      }).catch(error => observer.error(error));
    });
  }

  deletePhoto(photoId: string): Observable<void> {
    if (this.useMockData) {
      const index = this.mockPhotos.findIndex(p => p.id === photoId);
      if (index > -1) this.mockPhotos.splice(index, 1);
      return of(void 0).pipe(delay(500));
    }
    return this.http.delete<void>(`${this.apiUrl}/photos/${photoId}`);
  }
}