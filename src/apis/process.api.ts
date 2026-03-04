import axios from "axios";
import { ApiError, AudioConvertRequest, GifConvertRequest, MergeRequest, ProcessDto, ProcessResponse, VideoConvertRequest } from "../types";
import client from "./client";

export async function toAudio(data: AudioConvertRequest): Promise<ProcessResponse> {
    try {
        const res = await client.post('/process/toAudio', data);
        if (res === null)
            throw new ApiError(500, 'Unexpected error. Please try again.')
        return res.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Signup failed:', error.response.data)
            throw new ApiError(error.response.data.status, error.response.data.errorMessage || 'Signup failed')
        }
        throw new ApiError(0, 'Network error. Check your connection.')
    }
}

export async function toVideo(data: VideoConvertRequest): Promise<ProcessResponse> {
    try {
        const res = await client.post('/process/video/toVideo', data);
        if (res === null)
            throw new ApiError(500, 'Unexpected error. Please try again.')
        return res.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Signup failed:', error.response.data)
            throw new ApiError(error.response.data.status, error.response.data.errorMessage || 'Signup failed')
        }
        throw new ApiError(0, 'Network error. Check your connection.')
    }
}

export async function toGif(data: GifConvertRequest): Promise<ProcessResponse> {
    try {
        const res = await client.post('/process/video/toGif', data);
        if (res === null)
            throw new ApiError(500, 'Unexpected error. Please try again.')
        return res.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Signup failed:', error.response.data)
            throw new ApiError(error.response.data.status, error.response.data.errorMessage || 'Signup failed')
        }
        throw new ApiError(0, 'Network error. Check your connection.')
    }
}

export async function mergeMedia(data: MergeRequest): Promise<ProcessResponse> {
    try {
        const res = await client.post('/process/merge', data);
        if (res === null)
            throw new ApiError(500, 'Unexpected error. Please try again.')
        return res.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Signup failed:', error.response.data)
            throw new ApiError(error.response.data.status, error.response.data.errorMessage || 'Signup failed')
        }
        throw new ApiError(0, 'Network error. Check your connection.')
    }
}

export async function getAllProcesses(): Promise<ProcessDto[]> {
    try {
        const res = await client.get('/process/getAll');
        if (res === null)
            throw new ApiError(500, 'Unexpected error. Please try again.')
        return res.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Signup failed:', error.response.data)
            throw new ApiError(error.response.data.status, error.response.data.errorMessage || 'Signup failed')
        }
        throw new ApiError(0, 'Network error. Check your connection.')
    }
}