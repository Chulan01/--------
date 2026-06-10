import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureAuthenticated().pipe(map((authenticated) => authenticated ? true : router.createUrlTree(['/login'])));
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureAdmin().pipe(map((isAdmin) => isAdmin ? true : router.createUrlTree(['/'])));
};
