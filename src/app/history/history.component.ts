import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { HistoryEntry } from 'src/datatypes/viewmodel';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  public patientHistory: HistoryEntry[] = [];
  public patientId: string;
  public comment: string;

  constructor(private _dataService: DataService) {}

  public ngOnInit() {
    this.update();
  }

  public async addComment() {
    await this._dataService.addComment(this.patientId, this.comment);
    this.update();
  }

  private update() {
    this.patientHistory = this._dataService.getViewModel().patientHistory.reverse();
  }
}
