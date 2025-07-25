import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Application } from '../interfaces/application';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService implements Application {
  private http = inject(HttpClient);
  getCompanies(name: string): Observable<any> {
    return this.http.get(`${environment.COMPANIES_API}`, {
      params: { query: name },
    });
  }
  getApplications(queryVariables: any): Observable<any> {
    return this.http.get(`${environment.BASE_API}/applications`, {
      params: queryVariables,
    });
  }
  getApplication(id: string): Observable<any> {
    return this.http.get(`${environment.BASE_API}/applications/${id}`);
  }
  updateApplication(id: string, updateFields: any): Observable<any> {
    return this.http.patch(
      `${environment.BASE_API}/applications/${id}`,
      updateFields
    );
  }

  updateAttachments(id: string, attachment: any): Observable<any> {
    return this.http.post(
      `${environment.BASE_API}/applications/${id}/attachments`,
      attachment
    );
  }

  deleteAttachment(id: string, fileId: string): Observable<any> {
    return this.http.delete(`${environment.BASE_API}/applications/${id}/attachments/${fileId}`);
  }

  createApplication(data: any): Observable<any> {
    return this.http.post(`${environment.BASE_API}/applications`, data);
  }
  deleteApplication(id: string): Observable<any> {
    return this.http.delete(`${environment.BASE_API}/applications/${id}`);
  }
  getApplicationMetrics(): Observable<any> {
    return this.http.get(`${environment.BASE_API}/applications/metrics`);
  }
  getChartData(): Observable<any> {
    return this.http.get(`${environment.BASE_API}/applications/chart`);
  }
}
