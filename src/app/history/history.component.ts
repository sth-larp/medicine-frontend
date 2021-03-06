import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MatDialog, MatIconRegistry, MatSnackBar } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { QrData } from 'deus-qr-lib/lib/qr';
import { QrType } from 'deus-qr-lib/lib/qr.type';
import { QrReaderComponent } from 'src/app/qr-reader/qr-reader.component';
import { HistoryEntry } from 'src/datatypes/viewmodel';
import { DataService } from 'src/services/data.service';
import { renderTimestamp } from 'src/time-utils';

class PatientFilterOption {
  public patientId?: string;
  public patientFullName: string;

  public from(entry: HistoryEntry) {
    this.patientId = entry.patientId;
    this.patientFullName = entry.patientFullName;
    return this;
  }

  public all() {
    this.patientFullName = 'Все пациенты';
    return this;
  }

  public description() {
    if (this.patientId) {
      return `${this.patientFullName} (${this.patientId})`;
    } else {
      return this.patientFullName;
    }
  }
}

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent implements OnInit {
  public fullPatientHistory: HistoryEntry[] = [];
  public filteredPatientHistory: HistoryEntry[] = [];

  public filterControl = new FormControl();
  public patientFilterOptions: PatientFilterOption[] = [];
  public filteredPatientFilterOptions: Observable<PatientFilterOption[]>;
  public currentPatientFilterOption: PatientFilterOption;

  public addCommentForm: FormGroup;

  constructor(
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _matSnackBar: MatSnackBar,
    private _dialog: MatDialog,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    private _dataService: DataService) {
    iconRegistry.addSvgIcon(
      'analyze',
      sanitizer.bypassSecurityTrustResourceUrl('assets/analyze.svg'));
    iconRegistry.addSvgIcon(
        'scan-qr-code',
        sanitizer.bypassSecurityTrustResourceUrl('assets/scan-qr-code.svg'));
    this.addCommentForm = this._formBuilder.group({
      patientId: ['', Validators.required],
      comment: ['', Validators.required],
    });
  }

  public ngOnInit() {
    this.update();
    this.currentPatientFilterOption = this.patientFilterOptions[0];
    this.filterHistoryEntries();

    this.filteredPatientFilterOptions = this.filterControl.valueChanges
      .pipe(
        startWith<string | PatientFilterOption>(''),
        map((value) => typeof value == 'string' ? value : value.patientId),
        map((name) => name ? this.filterFilterOptions(name) : this.patientFilterOptions.slice()),
      );

    this.filterControl.valueChanges.subscribe((v) => {
      if (typeof v == 'string') { return; }
      this.currentPatientFilterOption = v;
      this.filterHistoryEntries();
    });
  }

  public async addComment(formDirective: FormGroupDirective) {
    // Need to use getRawValue() as that form field is potentially disabled,
    // and accessing value.patientId returns 'undefined'.
    try {
      await this._dataService.addComment(this.addCommentForm.getRawValue().patientId,
        this.addCommentForm.value.comment);
      this.update();
      formDirective.resetForm();
      this.filterHistoryEntries();
    } catch (e) {
      console.error(JSON.stringify(e));
      if (e.status && e.status == 404) {
        this._matSnackBar.open('Пациент с данным ID не найден.', '', { duration: 2000 });
      } else {
        this._matSnackBar.open('Неизвестная ошибка сервера :(', '', { duration: 2000 });
      }
    }
  }

  public newLabTest() {
    this._router.navigate(['choose-lab-tests']);
  }

  public scanQr() {
    const dialogRef = this._dialog.open(QrReaderComponent, {
      width: '500px',
      data: {
        title: 'Сканирование QR-кода реактивов',
        qrType: QrType.LabTerminalRefill,
      },
    });

    dialogRef.afterClosed().subscribe(async (result: QrData) => {
      if (result) {
        const hadTests = this._dataService.getViewModel().numTests;
        await this._dataService.scanQr(result);
        const haveTests = this._dataService.getViewModel().numTests;
        this._matSnackBar.open(`Добавлено реактивов на ${haveTests - hadTests} анализов`, '', { duration: 2000 } );
      }
    });
  }

  public displayFn(user?: PatientFilterOption): string | undefined {
    return user ? user.description() : undefined;
  }

  public displayTimestamp(entry: HistoryEntry): string {
    return renderTimestamp(entry.timestamp);
  }

  private update() {
    this.fullPatientHistory = this._dataService.getViewModel().patientHistory.slice().reverse();
    const seenPatientIds = {};
    this.patientFilterOptions = [new PatientFilterOption().all()];
    for (const entry of this.fullPatientHistory) {
      if (!seenPatientIds.hasOwnProperty(entry.patientId)) {
        this.patientFilterOptions.push(new PatientFilterOption().from(entry));
        seenPatientIds[entry.patientId] = true;
      }
    }

    // HACK: We need to control this.filterControl.setValue so this.patientFilterOptions
    // will propagate into this.filteredPatientFilterOptions. We only do it if current
    // filter is empty, if it's not - user will need to change value in filter control
    // anyway, which will trigger propagation. Proper fix would be to make this.patientFilterOptions
    // into Observable/another subscribable object.
    if (!(this.currentPatientFilterOption && this.currentPatientFilterOption.patientId)) {
      this.filterControl.setValue('');
    }
  }

  private filterHistoryEntries() {
    if (!this.currentPatientFilterOption.patientId) {
      this.addCommentForm.get('patientId').enable();
      this.filteredPatientHistory = this.fullPatientHistory;
    } else {
      this.addCommentForm.patchValue({
        patientId: Number(this.currentPatientFilterOption.patientId),
      });
      this.addCommentForm.get('patientId').disable();
      this.filteredPatientHistory = this.fullPatientHistory.filter(
        (e) => e.patientId == this.currentPatientFilterOption.patientId);
    }
  }

  private filterFilterOptions(name: string): PatientFilterOption[] {
    return this.patientFilterOptions.filter((option) =>
      option.description().toLowerCase().indexOf(name.toLowerCase()) >= 0);
  }
}
