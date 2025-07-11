/**
 * StringProcessor - A utility class for common string operations
 */
export class StringProcessor {
    
    /**
     * Capitalizes the first letter of a string
     * @param str - The input string
     * @returns The string with the first letter capitalized
     */
    static capitalize(str: string): string {
        if (!str || str.length === 0) {
            return str;
        }
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    /**
     * Reverses a string
     * @param str - The input string
     * @returns The reversed string
     */
    static reverse(str: string): string {
        return str.split('').reverse().join('');
    }
    
    /**
     * Checks if a string is a palindrome
     * @param str - The input string
     * @returns True if the string is a palindrome, false otherwise
     */
    static isPalindrome(str: string): boolean {
        const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleaned === cleaned.split('').reverse().join('');
    }
    
    /**
     * Truncates a string to a specified length
     * @param str - The input string
     * @param maxLength - Maximum length of the string
     * @param suffix - Suffix to add if truncated (default: '...')
     * @returns The truncated string
     */
    static truncate(str: string, maxLength: number, suffix: string = '...'): string {
        if (str.length <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength - suffix.length) + suffix;
    }
} 