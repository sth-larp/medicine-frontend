import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  constructor(
    private _matSnackBar: MatSnackBar,
    private _authService: AuthService) { }

  username: string;
  password: string;

  public async login(): Promise<void> {
    try {
      const v = await this._authService.tryLoginAndGetViewmodel(this.username, this.password);
      console.log(JSON.stringify(v));
    }
    catch (err) {
      console.warn(JSON.stringify(err));
      if (err.status == 404)
        this.showLoginFailedAlert('Персонаж с данным ID не найден');
      else if (err.status == 401)
        this.showLoginFailedAlert('Неправильный пароль');
      else
        this.showLoginFailedAlert('Ошибка подключения к серверу, повторите попытку позже');
    }
  }

  private showLoginFailedAlert(msg: string) {
    this._matSnackBar.open(msg, '', { duration: 2000 });
  }
}
