import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';
import {
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

import { MessageService } from 'primeng/api';

import {
  LucideAngularModule,
  Pencil,
  MapPin,
  Trash,
  Minus,
  Paperclip,
  FileText,
  Image,
  Eye,
  ArrowDownToLine,
} from 'lucide-angular';

import { finalize, switchMap, takeWhile, timer } from 'rxjs';

import { ApplicationService } from '../../services/application.service';
import { DrawerComponent } from '../drawer/drawer.component';
import { DialogComponent } from '../dialog/dialog.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

interface Application {
  id: string;
  companyName: string;
  domain: string;
  logo: string;
  role: string;
  location: string;
  source: string;
  jobPostLink: string;
  jobType: string;
  statusTimestamps: { [key: string]: string | null };
  interviewQuestions?: Section[];
  description?: string;
  createdAt: string;
  status: string;
}

interface Section {
  id: string;
  sectionName: string;
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
}

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
    SkeletonModule,
    AccordionModule,
    InputTextModule,
    ButtonModule,
    LoadingSpinnerComponent,
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
  readonly Minus = Minus;
  readonly Paperclip = Paperclip;
  readonly FileText = FileText;
  readonly Image = Image;
  readonly Eye = Eye;
  readonly ArrowDownToLine = ArrowDownToLine;

  formBuilder = inject(FormBuilder);

  id: string;
  application: Application | null = null;
  events: { status: string; date: string }[] = [];

  isLoading: boolean = false;
  drawerVisible: boolean = false;
  deleteDialogVisible: boolean = false;
  questionsEditable: boolean = false;

  applicationForm!: FormGroup;
  questionsForm = this.formBuilder.group({
    sections: this.formBuilder.array<FormGroup<any>>([]),
  });

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
    this.pollApplication();
  }

  private getApplication(): void {
    this.isLoading = true;
    this.appService.getApplication(this.id).subscribe({
      next: (res) => {
        this.application = res.data;
        this.initApplicationForm();
        this.questionsForm.reset();
        this.initQuestionsForm(res.data.interviewQuestions || []);
        this.events = Object.entries(res.data.statusTimestamps)
          .filter(([_, date]) => date !== null)
          .map(([status, date]) => ({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            date: new Date(date as string).toLocaleDateString(),
          }));
        this.isLoading = false;
      },
      error: (err) => {
        this.router.navigate(['/page-not-found']);
      },
    });
  }

  private initApplicationForm(): void {
    if (!this.application) {
      return;
    }

    const statusTimestamps = this.application.statusTimestamps || {};

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
          statusTimestamps['applied']
            ? new Date(statusTimestamps['applied'])
            : null,
          Validators.required,
        ],
        interviewing: [
          statusTimestamps['interviewing']
            ? new Date(statusTimestamps['interviewing'])
            : null,
        ],
        offered: [
          statusTimestamps['offered']
            ? new Date(statusTimestamps['offered'])
            : null,
        ],
        rejected: [
          statusTimestamps['rejected']
            ? new Date(statusTimestamps['rejected'])
            : null,
        ],
      }),
    });
  }

  initQuestionsForm(sectionsData: any[] = []) {
    const sectionsFormArray = this.formBuilder.array<FormGroup>([]);

    if (sectionsData.length) {
      sectionsData.forEach((section) => {
        sectionsFormArray.push(this.createSection(section));
      });
    } else {
      sectionsFormArray.push(this.createSection());
    }

    this.questionsForm.setControl('sections', sectionsFormArray);
  }

  createQuestion(data?: { id?: string; question?: string }): FormGroup {
    return this.formBuilder.group({
      id: data?.id ?? uuidv4(),
      question: [data?.question ?? '', Validators.required],
    });
  }

  createSection(data?: {
    id?: string;
    sectionName?: string;
    questions?: { id?: string; question?: string }[];
  }): FormGroup {
    return this.formBuilder.group({
      id: data?.id ?? uuidv4(),
      sectionName: [data?.sectionName ?? '', Validators.required],
      questions: this.formBuilder.array(
        data?.questions?.length
          ? data.questions.map((q) => this.createQuestion(q))
          : [this.createQuestion()]
      ),
    });
  }

  pollApplication() {
    timer(0, 3000)
      .pipe(
        switchMap(() => this.appService.getApplication(this.id)),
        takeWhile((res) => res.data.description === 'Processing...', true)
      )
      .subscribe({
        next: (res) => {
          if (this.application) {
            this.application.description = res.data.description;
          }
        },
        error: (err) => {
          console.error('Failed to fetch application', err);
        },
      });
  }

  cleanJobDescription(rawDescription: string): string {
    return rawDescription?.replace(/^```html\s*\n|\n```$/g, '').trim();
  }

  getSeverity(
    status?: string | null
  ): 'success' | 'danger' | 'info' | undefined {
    switch (status) {
      case 'offered':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'interviewing':
        return 'info';
      default:
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

  toggleQuestions() {
    this.questionsEditable = !this.questionsEditable;
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
            setTimeout(() => {
              this.getApplication();
              this.pollApplication();
            }, 1000);
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

  get sections(): FormArray {
    return this.questionsForm.get('sections') as FormArray;
  }

  getQuestions(index: number): FormArray {
    return this.sections.at(index).get('questions') as FormArray;
  }

  addSection() {
    const sections = this.questionsForm.get('sections') as FormArray;
    sections.push(this.createSection());
  }

  addQuestion(sectionIndex: number) {
    const questions = this.getQuestions(sectionIndex);
    questions.push(this.createQuestion());
  }

  removeSection(sectionIndex: number) {
    const sections = this.questionsForm.get('sections') as FormArray;
    if (sections.length > 1) {
      sections.removeAt(sectionIndex);
    }
  }

  removeQuestion(sectionIndex: number, questionIndex: number) {
    const questions = this.getQuestions(sectionIndex);
    if (questions.length > 1) {
      questions.removeAt(questionIndex);
    }
  }

  onQuestionFormSubmit() {
    console.log(this.questionsForm.value);
    this.appService
      .updateApplication(this.id, {
        interviewQuestions: this.questionsForm.value.sections,
      })
      .pipe(
        finalize(() => {
          this.questionsEditable = false;
          this.getApplication();
        })
      )
      .subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Questions updated successfully',
          });
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update questions',
          });
        },
      });
  }
}
