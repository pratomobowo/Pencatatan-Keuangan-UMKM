export const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

    if (!secret && process.env.NODE_ENV === 'production' && !isBuild) {
        // We warn but don't throw to allow the build process to complete.
        // The secret MUST be set in the runtime environment for actual security.
        console.warn('⚠️ [SECURITY WARNING] JWT_SECRET environment variable is not set. Using a weak fallback. Please set this in your production environment!');
    }

    return new TextEncoder().encode(secret || 'shop-customer-secret-key-change-in-production');
};
