import { Component, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-logout',
  imports: [],
  template: `<p>Realizando logout...</p>`
})
export class LogoutComponent implements OnInit{
  private auth: AuthService = new AuthService();

  ngOnInit(): void {
    this.auth.logout();
  }

}