import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-face-liveness',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './face-liveness.component.html',
  styleUrl: './face-liveness.component.scss'
})
export class FaceLivenessComponent implements OnInit {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;

  isLoading = false;
  isRecording = false;
  stream: MediaStream | null = null;
  step = 1;
  maxSteps = 3;
  currentInstruction = '';
  countdown = 0;
  livenessVerified = false;
  error = '';
  
  private validFramesCount = 0;

  instructions = [
    'Olhe diretamente para a câmera',
    'Pisque os olhos naturalmente',
    'Sorria levemente'
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.currentInstruction = this.instructions[0];
  }

  async startLivenessCheck() {
    try {
      this.isLoading = true;
      this.error = '';
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.play();
      }
      
      this.isLoading = false;
      this.startRecordingProcess();
      
    } catch (error) {
      this.error = 'Não foi possível acessar a câmera. Verifique as permissões.';
      this.isLoading = false;
    }
  }

  startRecordingProcess() {
    this.isRecording = true;
    this.step = 1;
    this.processNextStep();
  }

  processNextStep() {
    if (this.step > this.maxSteps) {
      this.completeLivenessCheck();
      return;
    }

    this.currentInstruction = this.instructions[this.step - 1];
    this.countdown = 3;
    
    const countdownInterval = setInterval(async () => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(countdownInterval);
        
        const isValid = await this.captureFrame();
        if (!isValid) {
          this.error = 'Face não detectada ou qualidade insuficiente. Tente novamente.';
          this.resetProcess();
          return;
        }
        
        this.validFramesCount++;
        this.step++;
        setTimeout(() => this.processNextStep(), 1000);
      }
    }, 1000);
  }

  async captureFrame() {
    if (!this.videoElement || !this.canvasElement) return false;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Enviar frame para Amazon Rekognition
      return await this.validateFrameWithRekognition(canvas);
    }
    return false;
  }
  
  async validateFrameWithRekognition(canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      // Converter canvas para base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      const response = await this.http.post<any>(`${environment.apiUrl}/liveness`, {
        image: base64Image,
        sessionId: `session-${Date.now()}-${this.step}`
      }).toPromise();
      
      console.log('Rekognition response:', response);
      
      return response.isLive && response.confidence > 85;
      
    } catch (error) {
      console.error('Erro na validação com Rekognition:', error);
      return false;
    }
  }



  async completeLivenessCheck() {
    this.isRecording = false;
    this.isLoading = true;
    
    // Processar resultado final
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Verificar se todas as etapas foram validadas pelo Rekognition
    if (this.validFramesCount >= this.maxSteps) {
      this.livenessVerified = true;
      this.isLoading = false;
      
      localStorage.setItem('liveness_verified', 'true');
      
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
    } else {
      this.error = `Verificação falhou. Apenas ${this.validFramesCount} de ${this.maxSteps} etapas foram validadas.`;
      this.isLoading = false;
      this.resetProcess();
    }
  }

  resetProcess() {
    this.step = 1;
    this.livenessVerified = false;
    this.isRecording = false;
    this.currentInstruction = this.instructions[0];
    this.validFramesCount = 0;
  }



  ngOnDestroy() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}