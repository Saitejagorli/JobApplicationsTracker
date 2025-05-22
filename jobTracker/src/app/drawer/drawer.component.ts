import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { DrawerModule } from 'primeng/drawer';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

import { LucideAngularModule, XIcon } from 'lucide-angular';

import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-drawer',
  imports: [
    ReactiveFormsModule,
    DrawerModule,
    LucideAngularModule,
    AutoCompleteModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
  ],
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss',
})
export class DrawerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) drawerVisible!: boolean;
  @Input({ required: true }) applicationForm!: any;
  @Input({ required: true }) title!: string;

  @Output() cancel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  @ViewChild('companyAutoComplete') companyAutoComplete!: any;

  private formBuilder = inject(FormBuilder);

  companySearchSubject = new Subject<string>();
  tableSearchSubject = new Subject<string>();
  destroy$ = new Subject<void>();

  readonly XIcon = XIcon;

  // job types dropdown options
  jobTypes = [
    { label: 'Full-time', value: 'full-time' },
    { label: 'Part-time', value: 'part-time' },
    { label: 'Internship', value: 'internship' },
    { label: 'Contract', value: 'contract' },
    { label: 'Freelance', value: 'freelance' },
    { label: 'Temporary', value: 'temporary' },
    { label: 'Remote', value: 'remote' },
    { label: 'Hybrid', value: 'hybrid' },
    { label: 'On-site', value: 'on-site' },
    { label: 'Volunteer', value: 'volunteer' },
  ];

  filteredCompanies: any = [];

  constructor(private appService: ApplicationService) {}

  ngOnInit(): void {
    this.initStatusTimestamps();
    this.initCompanySearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initStatusTimestamps(): void {
    const statusTimestampsGroup = this.applicationForm?.get(
      'statusTimestamps'
    ) as FormGroup;
    const applied = statusTimestampsGroup?.get('applied');
    const interviewing = statusTimestampsGroup?.get('interviewing');
    const offered = statusTimestampsGroup?.get('offered');
    const rejected = statusTimestampsGroup?.get('rejected');

    interviewing?.disable();
    offered?.disable();
    rejected?.disable();

    applied?.valueChanges.subscribe((value) => {
      if (value) {
        interviewing?.enable();
        rejected?.enable();
      } else {
        interviewing?.reset();
        interviewing?.disable();
        offered?.reset();
        offered?.disable();
        rejected?.reset();
        rejected?.disable();
      }
    });

    interviewing?.valueChanges.subscribe((value) => {
      if (value) {
        offered?.enable();
      } else {
        offered?.reset();
        offered?.disable();
      }
    });

    offered?.valueChanges.subscribe((value) => {
      if (value) {
        rejected?.reset();
      }
    });

    rejected?.valueChanges.subscribe((value) => {
      if (value) {
        offered?.reset();
      }
    });
  }

  onCancel() {
    this.cancel.emit();
  }
  private initCompanySearch(): void {
    this.companySearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query) {
            return this.appService.getCompanies(query);
          } else {
            return [[]];
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.filteredCompanies = data;
      });
  }

  searchCompanies(event: any) {
    const query = event.query;
    this.applicationForm.get('companyName')?.setValue(query);
    this.companySearchSubject.next(query);
  }

  onCompanySelect(event: any) {
    console.log(event);
    this.applicationForm.patchValue({
      companyName: event.value.name,
      domain: event.value.domain,
      logo: event.value.logo,
    });
  }

  onDropdownClick() {
    const currentValue =
      this.companyAutoComplete?.inputEL?.nativeElement?.value || '';
    this.searchCompanies({ query: currentValue });
  }

  onClear() {
    this.applicationForm.patchValue({
      companyName: '',
      domain: '',
      logo: '',
    });
  }

  statusDate(control: string): Date | null {
    const date = this.applicationForm.get('statusTimestamps')?.get(control)?.value;
    return date ? date : null;
  }

  onSubmit() {
    console.log(this.applicationForm.value);
    this.submit.emit();
  }
}
