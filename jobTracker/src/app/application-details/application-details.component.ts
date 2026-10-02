import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';

import { MessageService } from 'primeng/api';

import {
  ArrowDownToLine,
  Eye,
  FileText,
  Image,
  LucideAngularModule,
  MapPin,
  Minus,
  Paperclip,
  Pencil,
  Trash,
  X,
} from 'lucide-angular';

import {
  catchError,
  finalize,
  switchMap,
  takeWhile,
  tap,
  throwError,
  timer
} from 'rxjs';

import { ApplicationService } from '../../services/application.service';
import { DialogComponent } from '../dialog/dialog.component';
import { DrawerComponent } from '../drawer/drawer.component';
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
  isUrlParsed?: boolean;
  attachments?: Attachment[];
}

interface Attachment {
  _id: string;
  createdAt: string;
  fileName: string;
  contentType: string;
  size: number;
  status: 'PENDING' | 'UPLOADED' | 'FAILED';
  objectKey: string;
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
    FileUploadModule,
    LoadingSpinnerComponent,
    ProgressBarModule,
    TextareaModule,
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
  readonly X = X;

  formBuilder = inject(FormBuilder);

  id: string;
  application: Application | null = null;
  events: { status: string; date: string }[] = [];

  isLoading: boolean = false;
  drawerVisible: boolean = false;
  deleteDialogVisible = false;
  deleteContext: 'application' | 'attachment' | null = null;
  questionsEditable: boolean = false;

  uploadDialogueVisible: boolean = false;
  selectedFile: File | null = null;
  fileName: string = '';
  uploading: boolean = false;

  attachmentIdToDelete: string | null = null;

  descriptionDialogVisible: boolean = false;
  descriptionForm = this.formBuilder.group({
    description: ['', Validators.required],
  });

  applicationForm!: FormGroup;
  questionsForm = this.formBuilder.group({
    sections: this.formBuilder.array<FormGroup<any>>([]),
  });

  constructor(
    private appService: ApplicationService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
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
          : [this.createQuestion()],
      ),
    });
  }

  pollApplication() {
    timer(0, 3000)
      .pipe(
        switchMap(() => this.appService.getApplication(this.id)),
        takeWhile((res) => res.data.description === 'Processing...', true),
      )
      .subscribe({
        next: (res) => {
          if (this.application) {
            this.application.description = res.data.description;
            this.application.isUrlParsed = res.data.isUrlParsed;
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
    status?: string | null,
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

  openDeleteDialog(
    context: 'application' | 'attachment',
    attachmentId?: string,
  ) {
    this.deleteContext = context;
    this.attachmentIdToDelete = attachmentId || null;
    this.deleteDialogVisible = true;
  }

  handleDeleteDialogClose() {
    this.deleteDialogVisible = false;
    this.deleteContext = null;
    this.attachmentIdToDelete = null;
  }

  toggleQuestions() {
    this.questionsEditable = !this.questionsEditable;
  }

  onDeleteConfirm() {
    console.log(
      `Deleting ${this.deleteContext} with ID: ${this.attachmentIdToDelete}`,
    );
    if (this.deleteContext === 'application') {
      this.deleteApplication();
    } else if (
      this.deleteContext === 'attachment' &&
      this.attachmentIdToDelete
    ) {
      this.deleteFile(this.attachmentIdToDelete);
    }

    this.handleDeleteDialogClose();
  }

  deleteApplication() {
    this.appService
      .deleteApplication(this.id)
      .pipe(
        finalize(() => {
          this.deleteDialogVisible = false;
        }),
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
      this.getChangedFields(this.application, this.applicationForm.value),
    );
    const updateFields = this.getChangedFields(
      this.application,
      this.applicationForm.value,
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
            }, 800);
          }),
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

  onDescriptionSubmit() {
    if (this.descriptionForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Description is required',
      });
      return;
    }

    const description = this.descriptionForm.value.description;

    this.appService
      .updateApplication(this.id, { description })
      .pipe(
        finalize(() => {
          this.descriptionDialogVisible = false;
          this.descriptionForm.reset();
          setTimeout(() => {
            this.getApplication();
          }, 800);
        }),
      )
      .subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Summarization in progress, please wait...',
          });
          this.pollApplication();
          this.descriptionForm.reset();
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update description',
          });
        },
      });
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
        }),
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

  formatFileSize(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(1) + ' mb';
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getIconForMime(mimeType: string): any {
    if (mimeType.startsWith('image/')) return this.Image;
    return this.FileText;
  }

  previewFile(file: any) {
    this.appService.getViewUrlForAttachment(this.id, file._id).subscribe({
      next: (res) => {
        const viewUrl = res.data.viewUrl;
        window.open(viewUrl, '_blank');
      },
      error: (err) => {
        console.error('Failed to get view URL for attachment', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to get view URL for attachment',
        });
      },
    });
  }

  downloadFile(file: any) {
    this.appService.getDownloadUrlForAttachment(this.id, file._id).subscribe({
      next: (res) => {
        const downloadUrl = res.data.downloadUrl;
        window.open(downloadUrl, '_blank');
      },
      error: (err) => {
        console.error('Failed to get download URL for attachment', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to get download URL for attachment',
        });
      },
    });
  }

  onSelectFile(event: any) {
    const file = event.files[0];
    this.selectedFile = file;
    this.fileName = file?.name || '';
    console.log('Selected file:', file);
  }

  clearFile() {
    this.selectedFile = null;
    this.fileName = '';
  }

  async uploadFile() {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.appService
      .getUploadUrl(
        this.id,
        this.selectedFile.name,
        this.selectedFile.type,
        this.selectedFile.size,
      )
      .pipe(
        switchMap((res) => {
          const uploadUrl = res.data.uploadUrl;
          return this.appService
            .uploadFileToUrl(uploadUrl, this.selectedFile!)
            .pipe(
              switchMap(() => {
                return this.appService.markAttachmentAsUploaded(
                  this.id,
                  res.data.attachmentId,
                );
              }),
            );
        }),
        tap(() => {
          setTimeout(() => {
            this.getApplication();
          }, 800);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File uploaded successfully!',
          });
        }),
        catchError((err) => {
          console.error('Error during file upload:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update application',
          });

          return throwError(() => new Error('File upload failed'));
        }),

        finalize(() => {
          this.uploadDialogueVisible = false;
          this.selectedFile = null;
          this.fileName = '';
          this.uploading = false;
        }),
      )
      .subscribe();
  }

  async deleteFile(attachmentId: string) {
    this.appService
      .deleteAttachment(this.id, attachmentId)
      .pipe(
        tap(() => {
          //Refresh UI
          setTimeout(() => {
            this.getApplication();
          }, 800);

          //Show toast
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Attachment deleted successfully',
          });
        }),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete attachment',
          });
          return throwError(
            () => new Error('Failed to delete attachment', err),
          );
        }),
      )
      .subscribe();
  }

  getUploadedAttachments(): Attachment[] {
    return (
      this.application?.attachments?.filter(
        (file) => file.status === 'UPLOADED',
      ) || []
    );
  }
}
