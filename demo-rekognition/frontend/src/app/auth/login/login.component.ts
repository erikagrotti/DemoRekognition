import { Component, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-login',
  template: `<p>Redirecionando para login...</p>`
})
export class LoginComponent implements OnInit {
  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.login();
  }
}