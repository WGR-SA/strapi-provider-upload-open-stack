import axios, { AxiosRequestConfig } from 'axios';
import {createReadStream, ReadStream} from 'node:fs';

export interface ApplicationCredential {
  id: string;
  secret: string;
}

export interface Scope {
  project: {
    id: string;
  };
}

export class OpenStackStorage {
  private token: string;
  private endpoint: string;
  private authUrl: string;
  private applicationCredential: ApplicationCredential;
  private scope: Scope;

  constructor(authUrl: string, objectStorageUrl:string, region: string, applicationCredential: ApplicationCredential, scope: Scope) {
    this.endpoint = `${objectStorageUrl}/AUTH_${scope.project.id}`;
    this.authUrl = authUrl;
    this.applicationCredential = applicationCredential;
    this.scope = scope;
  }

  private getRFC7231Date(): string {
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[now.getUTCDay()];
    const date = now.getUTCDate().toString().padStart(2, '0');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = monthNames[now.getUTCMonth()];
    const year = now.getUTCFullYear();
    const hours = now.getUTCHours().toString().padStart(2, '0');
    const minutes = now.getUTCMinutes().toString().padStart(2, '0');
    const seconds = now.getUTCSeconds().toString().padStart(2, '0');
  
    return `${day}, ${date} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;
  }

  private async getToken(): Promise<string> {
    this.token = await this.authenticate(this.authUrl, this.applicationCredential, this.scope);
    return this.token;
  }

  private async authenticate(authUrl: string, applicationCredential: ApplicationCredential, scope: Scope): Promise<string> {
    try {
      const response = await axios.post(`${authUrl}/auth/tokens`, {
        auth: {
          identity: {
            methods: ['application_credential'],
            application_credential: applicationCredential,
          },
        },
      });

      const token = response.headers['x-subject-token'];
      if (!token) {
        throw new Error('Authentication failed. No token received.');
      }
      return token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  private getRequestConfig(extraHeaders?: Record<string, string>): AxiosRequestConfig {
    return {
      maxBodyLength: "Infinity",
      headers: {
        'Date': this.getRFC7231Date(),
        'Content-Type': 'application/octet-stream',
        'X-Auth-Token': this.token,
        ...extraHeaders,
      },
    };
  }

  public async uploadFile(container: string, filePath: string, fileName: string, extraHeaders?: Record<string, string>): Promise<string> {
    
    const fileStream = createReadStream(filePath);
    return this.uploadStream(container, fileStream, fileName, extraHeaders);
  }

  public async uploadStream(container: string, stream: ReadStream, fileName: string, extraHeaders?: Record<string, string>): Promise<string> {
    
    return new Promise(async (resolve, reject) => {
    
      if(!this.token) await this.getToken();

      const uploadUrl = `${this.endpoint}/${container}/${fileName}`;
      const params = this.getRequestConfig(extraHeaders);

      try {
        await axios.put(uploadUrl, stream, params);
        resolve(uploadUrl);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async deleteFile(container: string, fileName: string): Promise<void> {
    
    return new Promise(async (resolve, reject) => {
      if(!this.token) await this.getToken();

      const deleteUrl = `${this.endpoint}/${container}/${fileName}`;

      try {
        await axios.delete(deleteUrl, this.getRequestConfig());
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}
