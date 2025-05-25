import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ApplicationService } from '../services/application.service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone:true,
  providers : [ApplicationService]
})
export class AppComponent {
  title = 'jobTracker';
}
