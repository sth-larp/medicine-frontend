import { Injectable } from "@angular/core";
import { Http } from "@angular/http";

import { ViewModel, HistoryEntry, LabTest } from "src/datatypes/viewmodel";
import { currentTimestamp } from "src/app/util";
import { GlobalConfig } from "src/config";
import { AuthService } from "src/services/auth.service";

@Injectable()
export class DataService {
  // TODO: Remove when backend is enabled
  private _viewModel: ViewModel = {
    availableTests: [],
    patientHistory: [],
  };

  constructor(
    private _http: Http,
    private _authService: AuthService) {};

  public setViewModel(viewModel: ViewModel) { this._viewModel = viewModel; }
  public getViewModel() { return this._viewModel; }

  public async addComment(patientId: string, text: string) {
    const fullUrl = GlobalConfig.addCommentBaseUrl + this._authService.getUserId();
    const response = await this._http.post(fullUrl,
      { patientId, text },
      this._authService.getRequestOptionsWithSavedCredentials()).toPromise();

    if (response.json().viewModel == undefined) {
      console.error("Didn't get updated viewmodel");
      console.log(JSON.stringify(response.json()));
      console.log(response.status);
      return;
    }
    this.setViewModel(response.json().viewModel);
  }

  public async runTests(patientId: string, tests: LabTest[]) {
    const fullUrl = GlobalConfig.runTestsBaseUrl + this._authService.getUserId();
    const response = await this._http.post(fullUrl,
      { patientId, tests: tests.map(t => t.name) },
      this._authService.getRequestOptionsWithSavedCredentials()).toPromise();
      if (response.json().viewModel == undefined) {
        console.error("Didn't get updated viewmodel");
        console.log(JSON.stringify(response.json()));
        console.log(response.status);
        return;
      }
      this.setViewModel(response.json().viewModel);
  };
}