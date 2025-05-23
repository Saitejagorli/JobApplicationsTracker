import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

import { LucideAngularModule, XIcon } from 'lucide-angular';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-dialog',
  imports: [DialogModule, LucideAngularModule, ButtonModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  @Input({ required: true }) visible!: boolean;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) btnText!: string;

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  readonly XIcon = XIcon;

  onClose() {
    this.close.emit();
  }
  onSubmit() {
    this.submit.emit();
  }
}
