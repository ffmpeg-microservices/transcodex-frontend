import axios from "axios";
import client from "./client";
import { ApiError, StoredFile } from "../types";

export async function upload(file: FormData, onUploadProgress: (progress: string) => void): Promise<string> {
    try {
        const res = await client.post("/storage/upload", file, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress(progressEvent) {
                const { loaded, total } = progressEvent;
                const percentCompleted = total ? Math.round((loaded * 100) / total) : 0;
                onUploadProgress(`${percentCompleted}%`);
                console.log(`Upload progress: ${percentCompleted}%`);
            },
        }
        );
        return res.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Upload failed:', error.response.data);
            throw new ApiError(error.response.data.status, error.response.data.errorMessage || "Upload failed");
        }
        throw new ApiError(0, 'Network error. Check your connection.')
    }
}


export async function downloadFile(storageId: string): Promise<void> {
    const response = await client.get(`/storage/download/${storageId}`, {


        /*

        Axios by default assumes the response is JSON and tries to parse it. 
        A file is raw binary data — if axios tries to JSON parse a video or audio file, 
        it corrupts it completely. blob tells axios "don't touch this, hand me the raw bytes

        */
        responseType: 'blob',
    })

    // Extract filename from Content-Disposition header
    const disposition = response.headers['content-disposition'] as string | undefined
    let fileName = 'download'
    if (disposition) {
        const match = disposition.match(/filename="(.+)"/)
        if (match?.[1]) fileName = match[1]
    }

    /*

        The browser has no native way to "save a file" from JavaScript. 
        The only mechanism that exists is clicking an anchor tag with a download attribute. 
        But an anchor tag needs a URL — you can't point it at raw bytes in memory. 
        createObjectURL takes your blob and gives it a temporary blob://... URL the anchor can point to.

    */
    const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
}


export async function uploadMultiple(
    files: File[],
    onUploadProgress: (progress: string) => void
): Promise<string[]> {

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    try {
        const res = await client.post("/storage/multiUpload", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress(progressEvent) {
                const { loaded, total } = progressEvent;
                const percentCompleted = total ? Math.round((loaded * 100) / total) : 0;
                onUploadProgress(`${percentCompleted}%`);
                console.log(`Upload progress: ${percentCompleted}%`);
            },
        }
        );
        return res.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Upload failed:', error.response.data);
            throw new ApiError(error.response.data.status, error.response.data.errorMessage || "Upload failed");
        }
        throw new ApiError(0, 'Network error. Check your connection.')
    }
}

export async function getStoredFiles(): Promise<StoredFile[]> {
    const { data } = await client.get<StoredFile[]>('/storage/getUserUploadedMedia')
    return data
}