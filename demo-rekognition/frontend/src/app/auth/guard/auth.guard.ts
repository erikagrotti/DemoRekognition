import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.authService.login();
      return false;
    }
    
    // Verificar se passou pela verificação de liveness
    const livenessVerified = localStorage.getItem('liveness_verified');
    if (livenessVerified !== 'true') {
      this.router.navigate(['/auth/face-liveness']);
      return false;
    }
    
    return true;
  }
}