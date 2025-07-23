import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guard/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { CallbackComponent } from './auth/callback/callback.component';
import { FaceLivenessComponent } from './auth/face-liveness/face-liveness.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'auth/login',
        component: LoginComponent
    },
    {
        path: 'auth/callback',
        component: CallbackComponent
    },
    {
        path: 'auth/face-liveness',
        component: FaceLivenessComponent
    },
    {
        path: '**',
        redirectTo: ''
    }
];

