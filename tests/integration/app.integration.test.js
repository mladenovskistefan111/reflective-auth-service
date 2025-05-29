import request from 'supertest';
import app from '../../src/app';
import { logger } from '../../src/utils/logger';
jest.mock('../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));
describe('app.ts integration tests', () => {
    beforeAll(() => {
        logger.info.mockClear();
        logger.error.mockClear();
    });
    afterAll(() => {
    });
    it('should return 200 OK for the /health endpoint', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ status: 'ok', service: 'auth-service' });
    });
    it('should return 404 Not Found for an unhandled route', async () => {
        const res = await request(app).get('/non-existent-route');
        expect(res.statusCode).toEqual(404);
        expect(res.text).toContain('Cannot GET /non-existent-route');
    });
});
//# sourceMappingURL=app.integration.test.js.map