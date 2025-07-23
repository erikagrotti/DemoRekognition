import { Component, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  template: `<p>Processando login...</p>`
})

export class CallbackComponent implements OnInit {

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth.handleCallback();
    
    // Verificar se já passou pela verificação de liveness
    const livenessVerified = localStorage.getItem('liveness_verified');
    
    if (livenessVerified === 'true') {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/auth/face-liveness']);
    }
  }
}