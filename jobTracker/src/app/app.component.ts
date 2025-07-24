import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ApplicationService } from '../services/application.service';
import { AppwriteService } from '../services/appwrite.service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone:true,
  providers : [ApplicationService,AppwriteService]
})
export class AppComponent {
  title = 'jobTracker';
}
