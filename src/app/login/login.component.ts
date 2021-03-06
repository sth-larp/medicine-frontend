import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

import { AuthService } from 'src/services/auth.service';
import { DataService, ForeignViewModelError } from 'src/services/data.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  public username: string;
  public password: string;

  constructor(
    private _router: Router,
    private _matSnackBar: MatSnackBar,
    private _authService: AuthService,
    private _dataService: DataService) { }

  public async login(): Promise<void> {
    try {
      const v = await this._authService.tryLoginAndGetViewmodel(this.username, this.password);
      this._dataService.setViewModel(v);
      this._router.navigate(['history']);
    } catch (err) {
      console.warn(JSON.stringify(err));
      if (err instanceof ForeignViewModelError) {
        this.showLoginFailedAlert('Используйте аккаунт медицинской лаборатории (не персонажа)');
      } else  if (err.status == 404) {
        this.showLoginFailedAlert('Персонаж с данным ID не найден');
      } else if (err.status == 401) {
        this.showLoginFailedAlert('Неправильный пароль');
      } else {
        this.showLoginFailedAlert('Ошибка подключения к серверу, повторите попытку позже');
      }
      this._authService.logout();
    }
  }

  private showLoginFailedAlert(msg: string) {
    this._matSnackBar.open(msg, '', { duration: 2000 });
  }
}
