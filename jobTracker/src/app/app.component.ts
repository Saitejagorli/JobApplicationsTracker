import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


import { DashboardComponent } from './dashboard/dashboard.component';
import { ApplicationService } from '../services/application.service';
import { Application } from '../interfaces/application';



@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone:true,
  providers : [[{provide:ApplicationService,use:Application}]]
})
export class AppComponent {
  title = 'jobTracker';
}
