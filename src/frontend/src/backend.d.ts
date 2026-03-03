import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Photo {
    id: bigint;
    title: string;
    caption?: string;
    blobId: ExternalBlob;
    uploadedAt: Time;
}
export type Time = bigint;
export type SessionToken = string;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPhoto(sessionToken: SessionToken, blobId: ExternalBlob, title: string, caption: string | null): Promise<bigint>;
    adminLogin(userId: string, password: string): Promise<SessionToken>;
    adminLogout(token: SessionToken): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deletePhoto(sessionToken: SessionToken, photoId: bigint): Promise<void>;
    getAllPhotos(): Promise<Array<Photo>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPhoto(photoId: bigint): Promise<Photo | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    validateSession(token: SessionToken): Promise<boolean>;
}
