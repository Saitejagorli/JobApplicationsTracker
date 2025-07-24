import { Injectable } from '@angular/core';
import { Client, Storage, ID } from 'appwrite';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppwriteService {
  private client = new Client();
  private storage: Storage;

  constructor() {
    this.client
      .setEndpoint(environment.APPWRITE_ENDPOINT)
      .setProject(environment.APPWRITE_PROJECT_ID);

    this.storage = new Storage(this.client);
  }

  uploadFile(file: File, bucketId: string) {
    return this.storage.createFile(bucketId, ID.unique(), file);
  }

  deleteFile(bucketId: string, fileId: string) {
    return this.storage.deleteFile(bucketId, fileId);
  }
}
