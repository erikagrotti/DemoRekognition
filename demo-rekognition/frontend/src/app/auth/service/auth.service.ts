import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.dev';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private idTokenKey = 'cognito_id_token';
  private accessTokenKey = 'cognito_access_token';

  constructor() {}

  private isLocalStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  public isAuthenticated(): boolean {
    if(this.isLocalStorageAvailable()) {
      const token = localStorage.getItem(this.idTokenKey);
      return !!token;
    }

    return false
  }

  public login(): void {
    const { cognitoDomain, appClientId, redirectUri } = environment.authConfig;
    const responseType = 'token';
    const scope = 'openid+profile+email';
    const fullDomain = cognitoDomain.startsWith('http') ? cognitoDomain : `https://${cognitoDomain}`;
    const authUrl =
      `${fullDomain}/login?client_id=${appClientId}` +
      `&response_type=${responseType}` +
      `&scope=${scope}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`

    if(this.isLocalStorageAvailable()) {
      window.location.href = authUrl;
    }
  }

  public handleCallback(): void {
    
    if(this.isLocalStorageAvailable()) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      console.log('params', params)

      const idToken = params.get('id_token');
      const accessToken = params.get('access_token');

      if (idToken) {
        localStorage.setItem(this.idTokenKey, idToken);
      }
      if (accessToken) {
        localStorage.setItem(this.accessTokenKey, accessToken);
      }
        window.location.href = '/';
    }
  }

  public logout(): void {
    const { cognitoDomain, appClientId, redirectUri } = environment.authConfig;
    const fullDomain = cognitoDomain.startsWith('http') ? cognitoDomain : `https://${cognitoDomain}`;

    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(this.idTokenKey);
      localStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem('liveness_verified');
    }

    const scope = 'openid profile email';
      `${fullDomain}/logout` +
      `?client_id=${appClientId}` +
      `&scope=${encodeURIComponent(scope)}` + 
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = redirectUri;
  }

  public getUserEmail(): string | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }
    const token = localStorage.getItem(this.idTokenKey);
    if (!token) {
      return null;
    }

    try {
      const payload: any = jwtDecode(token);

      return payload.email ?? null;
    } catch (error) {
      console.error('Erro ao decodificar o token', error);
      return null;
    }
  }

  public getUserProfilePicture(): string | null {
    if (typeof localStorage === 'undefined') {
        return null;
    }

    const token = localStorage.getItem(this.idTokenKey);
    if (!token) {
        console.warn('Token não encontrado.');
        return null;
    }

    try {
        const payload: any = jwtDecode(token);
        console.log('Claims do usuário:', payload);

        if (payload.picture) {
            return payload.picture;
        } else {
            console.warn('Claim "picture" não encontrada no token.');
            return null;
        }
    } catch (error) {
        console.error('Erro ao decodificar token para obter a foto de perfil:', error);
        return null;
    }
  } 



  public isTokenValid(): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    const token = localStorage.getItem(this.idTokenKey);
    if (!token) {
      return false;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000;
      const currentTime = new Date().getTime();


      if (currentTime >= expirationTime) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error decoding token', error);
      this.logout();
      return false;
    }
  }

  public getUserGroup(): string | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    const token = localStorage.getItem(this.idTokenKey);
    if (!token) {
      return null;
    }

    try {
      const payload: any = jwtDecode(token);
      const groups: string[] | undefined = payload['cognito:groups'];
      console.log('Groups from Token', groups);

      if (!groups || groups.length === 0) {
        return null;
      }

      if (groups.includes('Admin')) {
        return 'Admin';
      } else if (groups.includes('Manager')) {
        return 'Manager';
      } else {
        return 'User';
      }

    } catch (error) {
      console.error('Erro ao decodificar o token', error);
      return null;
    }
  }

  public getUserName(): string | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }
    const token = localStorage.getItem(this.idTokenKey);
    if (!token) {
      return null;
    }

    try {
      const payload: any = jwtDecode(token);
      return payload.name ?? payload.given_name ?? null;
    } catch (err) {
      console.error('Erro ao decodificar token', err);
      return null;
    }
  }

  public isAdmin(): boolean {
    return this.getUserGroup() === 'Admin';
  }

  public viewAllClaims(): string | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    const token = localStorage.getItem(this.idTokenKey);
    if(!token) {
      return null;
    }

    try {
      const payload: any = jwtDecode(token);
      return JSON.stringify(payload, null, 2);
    } catch (err) {
      console.error('Erro ao decodificar token', err);
      return null;
    }
  }
}