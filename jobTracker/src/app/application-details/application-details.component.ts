import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';

import { MessageService } from 'primeng/api';

import { LucideAngularModule, Pencil, MapPin, Trash } from 'lucide-angular';

import { finalize } from 'rxjs';

import { ApplicationService } from '../../services/application.service';
import { DrawerComponent } from '../drawer/drawer.component';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
  selector: 'app-application-details',
  imports: [
    CommonModule,
    DrawerComponent,
    CardModule,
    TagModule,
    TimelineModule,
    LucideAngularModule,
    DatePipe,
    ReactiveFormsModule,
    DialogComponent,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.scss',
  standalone: true,
})
export class ApplicationDetailsComponent implements OnInit {
  readonly Pencil = Pencil;
  readonly MapPin = MapPin;
  readonly Trash = Trash;

  formBuilder = inject(FormBuilder);

  id: string;
  application: any;
  events: any;

  drawerVisible: boolean = false;
  deleteDialogVisible: boolean = false;

  applicationForm: any;

  constructor(
    private appService: ApplicationService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {
    this.id = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit(): void {
    this.getApplication();
  }

  private getApplication(): void {
    this.appService.getApplication(this.id).subscribe((res) => {
      this.application = res.data;
      this.initApplicationForm();
      this.events = Object.entries(res.data.statusTimestamps)
        .filter(([_, date]) => date !== null)
        .map(([status, date]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          date: new Date(date as string).toLocaleDateString(),
        }));
    });
  }

  private initApplicationForm(): void {
    const statusTimestamps = this.application.statusTimestamps;
    this.applicationForm = this.formBuilder.group({
      companyName: [this.application.companyName, Validators.required],
      domain: [this.application.domain, Validators.required],
      logo: [this.application.logo, Validators.required],
      role: [this.application.role, Validators.required],
      location: [this.application.location, Validators.required],
      source: [this.application.source, Validators.required],
      jobPostLink: [this.application.jobPostLink, Validators.required],
      jobType: [this.application.jobType, Validators.required],
      statusTimestamps: this.formBuilder.group({
        applied: [
          statusTimestamps.applied ? new Date(statusTimestamps.applied) : null,
          Validators.required,
        ],
        interviewing: [
          statusTimestamps.interviewing
            ? new Date(statusTimestamps.interviewing)
            : null,
        ],
        offered: [
          statusTimestamps.offered ? new Date(statusTimestamps.offered) : null,
        ],
        rejected: [
          statusTimestamps.rejected
            ? new Date(statusTimestamps.rejected)
            : null,
        ],
      }),
    });
  }

  cleanJobDescription(rawDescription: string): string {
    return rawDescription?.replace(/^```html\s*\n|\n```$/g, '').trim();
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

  getChangedFields = (original: any, updated: any): any => {
    const updateFields: any = {};
    for (const key in updated) {
      if (
        updated.hasOwnProperty(key) &&
        JSON.stringify(updated[key]) !== JSON.stringify(original[key])
      ) {
        updateFields[key] = updated[key];
      }
    }

    return updateFields;
  };

  handleDrawerClose() {
    this.drawerVisible = false;
    this.initApplicationForm();
  }

  handleDeleteDialogClose() {
    this.deleteDialogVisible = false;
  }

  onDeleteConfirm(): void {
    this.appService
      .deleteApplication(this.id)
      .pipe(
        finalize(() => {
          this.deleteDialogVisible = false;
        })
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted Successfully',
          });
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 800);
        },

        error: (err) => {
          this.deleteDialogVisible = false;
          if (err.status === 404) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Not Found',
              detail: 'Application not found.',
            });
          } else if (err.status === 400) {
            this.messageService.add({
              severity: 'error',
              summary: 'Invalid Request',
              detail: 'Invalid Application ID.',
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

  onSubmit() {
    console.log(this.applicationForm.value);
    console.log(
      this.getChangedFields(this.application, this.applicationForm.value)
    );
    const updateFields = this.getChangedFields(
      this.application,
      this.applicationForm.value
    );
    if (updateFields && Object.keys(updateFields).length > 0) {
      this.appService
        .updateApplication(this.id, updateFields)
        .pipe(
          finalize(() => {
            this.drawerVisible = false;
            this.applicationForm.reset();
            this.getApplication();
          })
        )
        .subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Application updated successfully',
            });
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update application',
            });
          },
        });
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'No Changes',
        detail: 'There are no updates to save',
      });
    }
  }
}
