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
            throw new ApiError(error.response.data.status, error.response.data.error || "Upload failed");
        }
        throw new ApiError(0, 'Network error. Check your connection.')
    }
}

export async function getStoredFiles(): Promise<StoredFile[]> {
    const { data } = await client.get<StoredFile[]>('/storage/getUserUploadedMedia')
    return data
}