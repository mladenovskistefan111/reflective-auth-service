import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, } from '../../../src/utils/validation-schemas';
describe('validation-schemas', () => {
    describe('registerSchema', () => {
        it('should validate a valid registration payload', () => {
            const payload = {
                email: 'test@example.com',
                password: 'Password123',
                username: 'testuser',
                firstName: 'John',
                lastName: 'Doe',
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeUndefined();
        });
        it('should validate a registration payload with only required fields', () => {
            const payload = {
                email: 'minimal@example.com',
                password: 'SecurePassword1',
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeUndefined();
        });
        it('should return an error for an invalid email', () => {
            const payload = {
                email: 'invalid-email',
                password: 'Password123',
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Please provide a valid email address');
            expect(error?.details[0].context?.key).toBe('email');
        });
        it('should return an error for missing email', () => {
            const payload = {
                password: 'Password123',
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Email is required');
            expect(error?.details[0].context?.key).toBe('email');
        });
        it('should return an error for a password less than 8 characters', () => {
            const payload = {
                email: 'test@example.com',
                password: 'short',
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Password must be at least 8 characters');
            expect(error?.details[0].context?.key).toBe('password');
        });
        it('should return an error for a password without uppercase, lowercase, or number', () => {
            const payload = {
                email: 'test@example.com',
                password: 'password_only',
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            expect(error?.details[0].context?.key).toBe('password');
        });
        it('should return an error for missing password', () => {
            const payload = {
                email: 'test@example.com',
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Password is required');
            expect(error?.details[0].context?.key).toBe('password');
        });
        it('should return an error for username with non-alphanumeric characters', () => {
            const payload = {
                email: 'test@example.com',
                password: 'Password123',
                username: 'user with spaces!',
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Username must only contain alphanumeric characters');
            expect(error?.details[0].context?.key).toBe('username');
        });
        it('should return an error for username less than 3 characters', () => {
            const payload = {
                email: 'test@example.com',
                password: 'Password123',
                username: 'ab',
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Username must be at least 3 characters');
            expect(error?.details[0].context?.key).toBe('username');
        });
        it('should return an error for username more than 30 characters', () => {
            const payload = {
                email: 'test@example.com',
                password: 'Password123',
                username: 'thisusernameiswaytoolongtobevalidinthisapp',
            };
            const { error } = registerSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Username must be less than 30 characters');
            expect(error?.details[0].context?.key).toBe('username');
        });
    });
    describe('loginSchema', () => {
        it('should validate a valid login payload', () => {
            const payload = {
                email: 'login@example.com',
                password: 'MyPassword123',
            };
            const { error } = loginSchema.validate(payload);
            expect(error).toBeUndefined();
        });
        it('should return an error for an invalid email', () => {
            const payload = {
                email: 'not-an-email',
                password: 'MyPassword123',
            };
            const { error } = loginSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Please provide a valid email address');
            expect(error?.details[0].context?.key).toBe('email');
        });
        it('should return an error for missing email', () => {
            const payload = {
                password: 'MyPassword123',
            };
            const { error } = loginSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Email is required');
            expect(error?.details[0].context?.key).toBe('email');
        });
        it('should return an error for missing password', () => {
            const payload = {
                email: 'login@example.com',
            };
            const { error } = loginSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Password is required');
            expect(error?.details[0].context?.key).toBe('password');
        });
    });
    describe('forgotPasswordSchema', () => {
        it('should validate a valid forgot password payload', () => {
            const payload = {
                email: 'forgot@example.com',
            };
            const { error } = forgotPasswordSchema.validate(payload);
            expect(error).toBeUndefined();
        });
        it('should return an error for an invalid email', () => {
            const payload = {
                email: 'not-an-email-for-forgot',
            };
            const { error } = forgotPasswordSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Please provide a valid email address');
            expect(error?.details[0].context?.key).toBe('email');
        });
        it('should return an error for missing email', () => {
            const payload = {};
            const { error } = forgotPasswordSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Email is required');
            expect(error?.details[0].context?.key).toBe('email');
        });
    });
    describe('resetPasswordSchema', () => {
        it('should validate a valid reset password payload', () => {
            const payload = {
                password: 'NewPassword123',
                confirmPassword: 'NewPassword123',
            };
            const { error } = resetPasswordSchema.validate(payload);
            expect(error).toBeUndefined();
        });
        it('should return an error if passwords do not match', () => {
            const payload = {
                password: 'NewPassword123',
                confirmPassword: 'MismatchPassword',
            };
            const { error } = resetPasswordSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Passwords do not match');
            expect(error?.details[0].context?.key).toBe('confirmPassword');
        });
        it('should return an error for a password less than 8 characters', () => {
            const payload = {
                password: 'short',
                confirmPassword: 'short',
            };
            const { error } = resetPasswordSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Password must be at least 8 characters');
            expect(error?.details[0].context?.key).toBe('password');
        });
        it('should return an error for a password without uppercase, lowercase, or number', () => {
            const payload = {
                password: 'password_only_reset',
                confirmPassword: 'password_only_reset',
            };
            const { error } = resetPasswordSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            expect(error?.details[0].context?.key).toBe('password');
        });
        it('should return an error for missing password', () => {
            const payload = {
                confirmPassword: 'SomePassword1',
            };
            const { error } = resetPasswordSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Password is required');
            expect(error?.details[0].context?.key).toBe('password');
        });
        it('should return an error for missing confirmPassword', () => {
            const payload = {
                password: 'SomePassword1',
            };
            const { error } = resetPasswordSchema.validate(payload);
            expect(error).toBeDefined();
            expect(error?.details[0].message).toBe('Password confirmation is required');
            expect(error?.details[0].context?.key).toBe('confirmPassword');
        });
    });
});
//# sourceMappingURL=validation-schemas.test.js.map