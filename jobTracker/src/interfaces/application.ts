import { Observable } from 'rxjs';
export abstract class Application {
  abstract getCompanies(name: string): Observable<any>;
  abstract getApplications(queryVariables: any): Observable<any>;
  abstract getApplication(id: string): Observable<any>;
  abstract updateApplication(id: string, updateFields: any): Observable<any>;
  abstract createApplication(data: any): Observable<any>;
  abstract deleteApplication(id: string): Observable<any>;
  abstract getApplicationMetrics(): Observable<any>;
  abstract getChartData(): Observable<any>;
}
