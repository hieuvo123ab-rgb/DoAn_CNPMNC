import apiClient from './client';

export interface PublicVerificationResponse {
  found: boolean;
  documentId?: number;
  title?: string;
  versionNumber?: number;
  documentType?: string;
  fileHash?: string;
  hashAlgorithm?: string;
  integrityStatus?: 'INTACT' | 'TAMPERED' | 'UNKNOWN' | string;
  signatureStatus?: 'UNSIGNED' | 'VALID' | 'INVALID' | string;
  signerUsername?: string;
  signedAt?: string;
  certSerialNumber?: string;
  certSubject?: string;
  certValidFrom?: string;
  certValidUntil?: string;
  verifiedAt?: string;
  tampered?: boolean;
  message?: string;
}

export const verificationApi = {
  verifyPublic: async (params: { docId?: number; version?: number; hash?: string }): Promise<PublicVerificationResponse> => {
    const res = await apiClient.get<PublicVerificationResponse>('/public/verify', { params });
    return res.data;
  },

  verifyFile: async (file: File): Promise<PublicVerificationResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<PublicVerificationResponse>('/public/verify-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getWatermarkedDownloadUrl: (docId: number, versionNumber?: number, watermarkText?: string, includeQr = true): string => {
    const token = localStorage.getItem('edms_token');
    const queryParts: string[] = [`includeQr=${includeQr}`];
    if (watermarkText) queryParts.push(`watermarkText=${encodeURIComponent(watermarkText)}`);
    if (token) queryParts.push(`token=${encodeURIComponent(token)}`);
    const qs = queryParts.join('&');

    return versionNumber
      ? `/api/documents/${docId}/versions/${versionNumber}/download-watermarked?${qs}`
      : `/api/documents/${docId}/download-watermarked?${qs}`;
  },

  getWatermarkedPreviewUrl: (docId: number, versionNumber?: number, watermarkText?: string, includeQr = true): string => {
    const token = localStorage.getItem('edms_token');
    const queryParts: string[] = [`includeQr=${includeQr}`];
    if (watermarkText) queryParts.push(`watermarkText=${encodeURIComponent(watermarkText)}`);
    if (token) queryParts.push(`token=${encodeURIComponent(token)}`);
    const qs = queryParts.join('&');

    return versionNumber
      ? `/api/documents/${docId}/versions/${versionNumber}/preview-watermarked?${qs}`
      : `/api/documents/${docId}/preview-watermarked?${qs}`;
  }
};
