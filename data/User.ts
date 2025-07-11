/**
 * User interface representing a user in the system
 */
export interface User {
    /** Unique identifier for the user */
    id: number;
    
    /** User's full name */
    name: string;
    
    /** User's email address */
    email: string;
    
    /** User's role in the system */
    role?: UserRole;
    
    /** Timestamp when the user was created */
    createdAt?: Date;
    
    /** Whether the user account is active */
    isActive?: boolean;
}

/**
 * Enumeration of possible user roles
 */
export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    MODERATOR = 'moderator'
}

/**
 * Interface for user creation data
 */
export interface CreateUserData {
    name: string;
    email: string;
    role?: UserRole;
} 