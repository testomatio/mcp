import fs from 'node:fs/promises';
import path from 'node:path';

import { ATTACHMENT_RESOURCE_KEYS } from '../configs/attachments-config.js';

export const attachmentMethods = {
  listAttachmentsForKey({ resourceKey, resourceId }) {
    this.assertSupportedAttachmentResourceKey(resourceKey);
    return this.apiClient.list('attachments', { [resourceKey]: resourceId });
  },

  async uploadAttachmentForKey({ resourceKey, resourceId, filePath }) {
    this.assertSupportedAttachmentResourceKey(resourceKey);
    const formData = await this.buildAttachmentFormData(filePath);

    return this.apiClient.createMultipart('attachments', formData, {
      [resourceKey]: resourceId,
    });
  },

  deleteAttachmentForKey({ resourceKey, resourceId, attachmentId }) {
    this.assertSupportedAttachmentResourceKey(resourceKey);
    return this.apiClient.delete('attachments', attachmentId, { [resourceKey]: resourceId });
  },

  async buildAttachmentFormData(filePath) {
    const resolvedPath = path.resolve(String(filePath));
    const data = await fs.readFile(resolvedPath);
    const formData = new FormData();

    formData.append('file', new Blob([data]), path.basename(resolvedPath));
    return formData;
  },

  assertSupportedAttachmentResourceKey(resourceKey) {
    if (!ATTACHMENT_RESOURCE_KEYS.includes(resourceKey)) {
      throw new Error(`Unsupported attachment resource key: ${resourceKey}`);
    }
  },
};
