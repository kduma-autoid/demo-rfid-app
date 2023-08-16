import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'scan',
    loadComponent: () => import('./scan/scan.page').then( m => m.ScanPage)
  },
  {
    path: 'cracker',
    loadComponent: () => import('./cracker/cracker.page').then( m => m.CrackerPage)
  },
];
