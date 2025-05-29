import { generateJwt, verifyJwt } from '../../../src/utils/jwt';
import { ApiError } from '../../../src/utils/errors';
import jwt from 'jsonwebtoken';
jest.mock('jsonwebtoken', () => {
    const originalModule = jest.requireActual('jsonwebtoken');
    return {
        ...originalModule,
        verify: jest.fn(),
        sign: jest.fn().mockImplementation((payload, secret, options) => {
            return originalModule.sign(payload, secret, options);
        }),
    };
});
describe('jwt utility functions', () => {
    const mockPayload = {
        id: 1,
        email: 'test@example.com',
        role: 'USER',
    };
    const secret = 'supersecretjwtkeyforunitests';
    beforeAll(() => {
        process.env.JWT_SECRET = secret;
    });
    afterAll(() => {
        delete process.env.JWT_SECRET;
    });
    afterEach(() => {
        process.env.JWT_SECRET = secret;
        jest.clearAllMocks();
        jwt.verify.mockImplementation((token, secret, options) => {
            return jest.requireActual('jsonwebtoken').verify(token, secret, options);
        });
    });
    describe('generateJwt', () => {
        it('should generate a valid JWT token', () => {
            const token = generateJwt(mockPayload, '1h');
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });
        it('should include the correct payload in the generated token', () => {
            const token = generateJwt(mockPayload);
            const decoded = jwt.verify(token, secret);
            expect(decoded.id).toBe(mockPayload.id);
            expect(decoded.email).toBe(mockPayload.email);
            expect(decoded.role).toBe(mockPayload.role);
        });
        it('should throw an error if JWT_SECRET is not defined', () => {
            delete process.env.JWT_SECRET;
            expect(() => generateJwt(mockPayload)).toThrow('JWT_SECRET is not defined in environment variables');
        });
        it('should generate a token with a specified expiration', () => {
            const token = generateJwt(mockPayload, '1s');
            const decoded = jwt.decode(token);
            expect(decoded.exp).toBeDefined();
        });
    });
    describe('verifyJwt', () => {
        it('should successfully verify a valid token', () => {
            const token = generateJwt(mockPayload, '1h');
            const decoded = verifyJwt(token);
            expect(decoded).toEqual(expect.objectContaining(mockPayload));
        });
        it('should throw ApiError with 401 for an expired token', async () => {
            const expiredToken = generateJwt(mockPayload, '1ms');
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(() => verifyJwt(expiredToken)).toThrow(new ApiError(401, 'Token expired'));
        });
        it('should throw ApiError with 401 for an invalid token (malformed)', () => {
            const invalidToken = 'invalid.jwt.token';
            expect(() => verifyJwt(invalidToken)).toThrow(new ApiError(401, 'Invalid token'));
        });
        it('should throw ApiError with 401 for a token signed with a different secret', () => {
            const wrongSecret = 'anothersecret';
            const tokenWithWrongSecret = jwt.sign(mockPayload, wrongSecret, { expiresIn: '1h' });
            expect(() => verifyJwt(tokenWithWrongSecret)).toThrow(new ApiError(401, 'Invalid token'));
        });
        it('should throw an error if JWT_SECRET is not defined', () => {
            const token = jwt.sign(mockPayload, secret, { expiresIn: '1h' });
            delete process.env.JWT_SECRET;
            expect(() => verifyJwt(token)).toThrow('JWT_SECRET is not defined in environment variables');
        });
        it('should rethrow unknown errors from jwt.verify', () => {
            const customError = new Error('Unknown JWT error');
            jwt.verify.mockImplementation(() => {
                throw customError;
            });
            const token = generateJwt(mockPayload);
            expect(() => verifyJwt(token)).toThrow('Unknown JWT error');
        });
    });
});
//# sourceMappingURL=jwt.test.js.map