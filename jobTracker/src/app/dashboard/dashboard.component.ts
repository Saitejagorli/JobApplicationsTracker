// --------------------
// Angular core Imports
// ---------------------
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { DatePipe } from '@angular/common';

// --------------------
// Rxjs Operators
// ---------------------
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  takeUntil,
  finalize,
} from 'rxjs';

// --------------------
// PrimeNg  Modules
// ---------------------
import { ChartModule } from 'primeng/chart';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

import { MessageService } from 'primeng/api';
// --------------------
// Lucide Icons
// ---------------------
import {
  LucideAngularModule,
  ClipboardList,
  CalendarPlus,
  BadgeCheck,
  MailCheck,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  Ghost,
  ArrowDownUp,
} from 'lucide-angular';

// --------------------
// Services
// ---------------------
import { ApplicationService } from '../../services/application.service';

import { DrawerComponent } from '../drawer/drawer.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DrawerComponent,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TitleCasePipe,
    DatePipe,
    ChartModule,
    LucideAngularModule,
    TableModule,
    ToastModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TagModule,
    SelectModule,
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    private appService: ApplicationService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  readonly ClipboardList = ClipboardList;
  readonly CalendarPlus = CalendarPlus;
  readonly BadgeCheck = BadgeCheck;
  readonly MailCheck = MailCheck;
  readonly CalendarClock = CalendarClock;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly Ghost = Ghost;
  readonly ArrowDownUp = ArrowDownUp;

  @ViewChild('table') table!: Table;

  private formBuilder = inject(FormBuilder);

  tableSearchSubject = new Subject<string>();
  destroy$ = new Subject<void>();

  data: any;
  options: any;

  basicData: any;
  basicOptions: any;

  first: number = 0;
  rows: number = 5;
  loading: boolean = false;
  rowsPerPageOptions: Array<number> = [5, 10, 25, 50];
  totalRecords: number = 0;

  queryVariables: any = {};
  searchValue: string = '';
  sortOrder: string = 'desc';

  //status options for filter
  statusOptions: { [Key: string]: string }[] = [
    { label: 'Applied', value: 'applied' },
    { label: 'Interviewing', value: 'interviewing' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Offered', value: 'offered' },
  ];
  selectedStatus: string = '';

  drawerVisible: boolean = false;

  applicationForm = this.formBuilder.group({
    companyName: ['', Validators.required],
    domain: ['', Validators.required],
    logo: ['', Validators.required],
    role: ['', Validators.required],
    location: ['', Validators.required],
    source: ['', Validators.required],
    jobPostLink: ['', Validators.required],
    jobType: ['', Validators.required],
    statusTimestamps: this.formBuilder.group({
      applied: [null, Validators.required],
      interviewing: [null],
      offered: [null],
      rejected: [null],
    }),
  });

  applications: any;
  applicationMetrics: any;

  skipFirstLazyLoad = true;

  ngOnInit(): void {
    this.initRouteParams();
    this.initDashboard();
    this.initTableSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initRouteParams(): void {
    this.route.queryParams.subscribe((params) => {
      const offset = Number(params['offset']) || 0;
      const limit = Number(params['limit']) || 5;
      const sortOrder = params['sortOrder'];
      const status = params['status'];
      const searchValue = params['searchValue'];

      this.queryVariables = {
        offset: offset,
        limit: limit,
        sortOrder: ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc',
      };

      if (searchValue) {
        this.searchValue = searchValue;
        this.queryVariables.searchValue = searchValue;
      }

      if (status) {
        this.selectedStatus = status;
        this.queryVariables.status = status;
      }

      this.first = this.queryVariables.offset;
      this.rows = this.queryVariables.limit;

      this.getApplications();
    });
  }

  private initDashboard(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');

    // get application metrics
    this.appService.getApplicationMetrics().subscribe((res) => {
      this.applicationMetrics = res.data;
      const { applied, interviewsScheduled, rejected, offersReceived } =
        this.applicationMetrics;
      this.data = {
        labels: ['Applied', 'Interviewing', 'Rejected', 'Offered'],
        datasets: [
          {
            data: [applied, interviewsScheduled, rejected, offersReceived],
            backgroundColor: [
              documentStyle.getPropertyValue('--p-indigo-600'),
              documentStyle.getPropertyValue('--p-indigo-400'),
              documentStyle.getPropertyValue('--p-indigo-300'),
              documentStyle.getPropertyValue('--p-indigo-200'),
            ],
            // hoverBackgroundColor:[documentStyle.getPropertyValue('--p-indigo-300'),documentStyle.getPropertyValue('--p-indigo-200'),documentStyle.getPropertyValue('--p-indigo-100'),documentStyle.getPropertyValue('--p-indigo-500')]
            // backgroundColor: [documentStyle.getPropertyValue('--p-teal-500'), documentStyle.getPropertyValue('--p-rose-500'), documentStyle.getPropertyValue('--p-cyan-500'),documentStyle.getPropertyValue('--p-gray-500')],
            // hoverBackgroundColor: [documentStyle.getPropertyValue('--p-teal-400'), documentStyle.getPropertyValue('--p-rose-400'), documentStyle.getPropertyValue('--p-cyan-400'),documentStyle.getPropertyValue('--p-gray-400')]
          },
        ],
      };
    });

    // get last six months chart data
    this.appService.getChartData().subscribe((res) => {
      const months = res.data.map((aggr: any) => aggr.month);
      const count = res.data.map((aggr: any) => aggr.count);
      this.basicData = {
        labels: months,
        datasets: [
          {
            label: 'Applications',
            data: count,
            backgroundColor: [
              '#f0ebff',
              '#f0ebff',
              '#f0ebff',
              '#f0ebff',
              '#f0ebff',
              '#f0ebff',
              '#f0ebff',
            ],
            borderColor: [
              documentStyle.getPropertyValue('--p-primary-color'),
              documentStyle.getPropertyValue('--p-primary-color'),
              documentStyle.getPropertyValue('--p-primary-color'),
              documentStyle.getPropertyValue('--p-primary-color'),
              documentStyle.getPropertyValue('--p-primary-color'),
              documentStyle.getPropertyValue('--p-primary-color'),
              documentStyle.getPropertyValue('--p-primary-color'),
            ],
            borderWidth: 1, // Remove border completely
          },
        ],
      };
    });

    // pie chart options
    this.options = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            color: textColor,
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    };

    const textColorSecondary = documentStyle.getPropertyValue(
      '--p-text-muted-color'
    );

    // bar chart options
    this.basicOptions = {
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            display: false, // Hide grid lines on X-axis
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            display: false, // Hide grid lines on Y-axis
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    };
  }

  private initTableSearch(): void {
    this.tableSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchValue) => {
        this.queryVariables.searchValue = searchValue;
        this.onSearchOrFilterChange();
      });
  }

  onSearch(event: any) {
    this.tableSearchSubject.next(this.searchValue);
  }

  clearSearch() {
    this.searchValue = '';
    this.queryVariables.searchValue = '';
    this.onSearchOrFilterChange();
  }

  onStatusChange(selectedStatus: string) {
    this.queryVariables.status = selectedStatus;
    this.onSearchOrFilterChange();
  }

  clearFilter() {
    if (this.selectedStatus) {
      this.selectedStatus = '';
      delete this.queryVariables.status;
      this.onSearchOrFilterChange();
    }
  }

  onSearchOrFilterChange() {
    this.queryVariables.offset = 0;
    this.queryVariables.limit = this.rows;
    this.table.first = 0;
    this.getApplications();
  }

  onSort() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.queryVariables.sortOrder = this.sortOrder;
    this.onSearchOrFilterChange();
  }

  getSeverity(status: string) {
    {
      switch (status) {
        case 'offered':
          return 'success';
        case 'rejected':
          return 'danger';
        case 'interviewing':
          return 'info';
      }
      return undefined;
    }
  }

  loadApplicationsLazy(event: any) {
    if (this.skipFirstLazyLoad) {
      this.skipFirstLazyLoad = false;
      return;
    }
    // Calculate offset from the "first" index and the rows per page
    this.first = event.first;
    this.rows = event.rows;

    this.queryVariables.offset = this.first;
    this.queryVariables.limit = this.rows;

    console.log(this.queryVariables);
    console.log('he');

    this.getApplications();
  }

  getApplications() {
    const currentParams = this.route.snapshot.queryParams;
    const newParams = this.queryVariables;

    // Only navigate if params are actually different
    const paramsChanged =
      Object.keys(newParams).some((key) => {
        // Convert both values to strings for comparison
        const currentValue =
          currentParams[key] !== undefined
            ? String(currentParams[key])
            : undefined;
        const newValue =
          newParams[key] !== undefined ? String(newParams[key]) : undefined;
        return currentValue !== newValue;
      }) ||
      Object.keys(currentParams).some(
        (key) =>
          newParams[key] === undefined && currentParams[key] !== undefined
      );

    if (paramsChanged) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: newParams,
      });
    }

    this.appService.getApplications(this.queryVariables).subscribe((res) => {
      this.applications = res.data.applications.map((application: any) => {
        return {
          companyName: application.companyName,
          logo: application.logo,
          domain: application.domain,
          role: application.role,
          date: application.createdAt,
          location: application.location,
          source: application.source,
          status: application.status,
          action: {
            text: 'view',
            id: application._id,
          },
        };
      });
      this.totalRecords = res.data.total;
    });
  }

  onDrawerClose() {
    this.drawerVisible = false;
    this.applicationForm.reset();
  }

  onSubmit() {
    this.appService
      .createApplication(this.applicationForm.value)
      .pipe(
        finalize(() => {
          this.drawerVisible = false;
          this.applicationForm.reset();
          this.getApplications();
          this.initDashboard();
        })
      )
      .subscribe({
        next: (res: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: res.message || 'Application created successfully.',
          });
        },
        error: (err: any) => {
          if (err.status === 400) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Invalid Input',
              detail:
                err.error?.message || 'Please check the data and try again.',
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Something went wrong. Please try again later.',
            });
          }
        },
      });
  }
}
