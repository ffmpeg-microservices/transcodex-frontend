import axios from "axios"
import { ApiError, LoginResponse } from "../types"
import publicClient from "./client"
import client from "./client"

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
    try {
        const res = await publicClient.post('/auth/login', { username, password })
        if (res === null) throw new ApiError(500, 'Unexpected error. Please try again.')
        return res.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Signup failed:', error.response.data)
            throw new ApiError(error.response.data.status, error.response.data.errorMessage || 'Signup failed')
        }
        throw new ApiError(0, 'Network error. Check your connection.')
    }
}

export async function signupApi(
    fullName: string,
    email: string,
    username: string,
    password: string
): Promise<LoginResponse> {
    try {
        const res = await publicClient.post('/auth/signup', { fullName, email, username, password })
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

export async function refreshToken(): Promise<string> {
    try {
        const res = await client.post('/auth/refresh', {}, { withCredentials: true })
        if (res === null)
            throw new ApiError(500, 'Unexpected error. Please try again.')
        return res.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Refresh failed:', error.response.data)
            throw new ApiError(error.response.data.status, error.response.data.errorMessage || 'Refresh failed')
        }
        throw new ApiError(0, 'Network error. Check your connection.')
    }
}

export async function logoutApi(): Promise<string> {
    try {
        const res = await client.post('/auth/logout', {}, { withCredentials: true })
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

