import type { ReadStream } from 'node:fs';
import { createLogger } from '@strapi/logger';
import { createReadStream} from 'streamifier';
import { OpenStackStorage, ApplicationCredential, Scope } from './openstackStorage';

interface File {
  name: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: Record<string, unknown>;
  hash: string;
  ext?: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  path?: string;
  provider?: string;
  provider_metadata?: Record<string, unknown>;
  stream?: ReadStream;
  buffer?: Buffer;
}

interface InitOptions {
  authUrl: string;
  objectStorageUrl: string;
  region: string;
  application_credential_id: string;
  application_credential_secret: string;
  project_id: string;
  container: string;
  prefix?: string;
};


console.log('init');

module.exports = {

    

  init: (config: InitOptions) => {
    
    const logger = createLogger({ level: 'info' });
    const {authUrl, objectStorageUrl, region, application_credential_id, application_credential_secret, project_id, container, prefix}  = config;
    const os = new OpenStackStorage(authUrl, objectStorageUrl, region, {id: application_credential_id, secret: application_credential_secret}, {project: {id: project_id}});

    const upload = async (file, customParams = {}): Promise<void> => {
      return new Promise(async (resolve, reject) => {
        if (!file.stream && !file.buffer) {
          reject(new Error('Missing file stream or buffer'));
          return;
        }
        
        try {
          // Extract the necessary file information
          let fileName = file.ext? `${file.hash}${file.ext}`: file.hash;
          fileName = prefix? `${prefix}/${fileName}`: fileName;
          const extraHeaders = {"Content-Type": file.mime}

          logger.info(`Uploading file "${fileName}" to container "${container}"...`);
          //strapi.log.info(`File "${fileName}" uploaded successfully.`);
    
          // Perform the upload using openstackStorage.uploadFile
          if (file.stream) {
            file.url = await os.uploadStream(container, file.stream, fileName, extraHeaders);
          } else if (file.buffer) {
            // If you want to support buffer uploads as well
            // Convert the buffer to a readable stream using `streamifier`
            const stream = createReadStream(file.buffer);
            file.url = await os.uploadStream(container, stream, fileName, extraHeaders);
          }
    
          // Resolve the promise if the upload is successful
          resolve();
        } catch (error) {
          // Reject the promise if there's an error during upload
          reject(error);
        }
      });
    }

    const deleteFile = async (file): Promise<void> => {
      return new Promise(async (resolve, reject) => {
        
        try {
          // Extract the necessary file information
          let fileName = file.ext? `${file.hash}${file.ext}`: file.hash;
          fileName = prefix? `${prefix}/${fileName}`: fileName;

          await os.deleteFile(container, fileName);
    
          // Resolve the promise if the upload is successful
          resolve();
        } catch (error) {
          // Reject the promise if there's an error during upload
          reject(error);
        }
      });
    }

    return {
      async upload(file, customParams = {}): Promise<void> {
        return upload(file, customParams);
      },

      async uploadStream(file, customParams = {}) {
        return upload(file, customParams); 
      },

      async delete(file) {
        return deleteFile(file); 
      },

      async isPrivate() {
        return false;
      },
    };
  },
};