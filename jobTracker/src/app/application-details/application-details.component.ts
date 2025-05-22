import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';

import { LucideAngularModule, Pencil, MapPin } from 'lucide-angular';

import { ApplicationService } from '../../services/application.service';
import { DrawerComponent } from '../drawer/drawer.component';

import { DatePipe } from '@angular/common';

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
  ],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.scss',
  standalone: true,
})
export class ApplicationDetailsComponent implements OnInit {
  readonly Pencil = Pencil;
  readonly MapPin = MapPin;

  formBuilder = inject(FormBuilder);

  id: string;
  application: any;
  events: any;

  drawerVisible: boolean = false;

  applicationForm: any;

  constructor(
    private appService: ApplicationService,
    private route: ActivatedRoute
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

  onCancel() {
    this.drawerVisible = false;
    this.initApplicationForm();
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
        .subscribe((res) => {
          console.log(res);
          this.drawerVisible = false;
          this.applicationForm.reset();
          this.getApplication();
        });
    }
  }
}
