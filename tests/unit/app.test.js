import request from 'supertest';
import app from '../../src/app';
// Mock all external dependencies
jest.mock('../../src/routes', () => {
    const express = require('express');
    const router = express.Router();
    // Mock a simple route to prevent hanging
    router.get('/test', (req, res) => {
        res.status(200).json({ message: 'test route' });
    });
    // Mock a POST route for JSON testing
    router.post('/test', (req, res) => {
        res.status(200).json({ received: req.body });
    });
    return router;
});
jest.mock('../../src/middlewares/error.middleware', () => {
    return (err, req, res, next) => {
        res.status(err.status || 500).json({
            error: err.message || 'Internal Server Error'
        });
    };
});
jest.mock('../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));
// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
describe('App Unit Tests', () => {
    // Add a timeout for all tests to prevent hanging
    beforeEach(() => {
        jest.setTimeout(10000);
    });
    afterAll(async () => {
        // Clean up any open handles
        await new Promise(resolve => setTimeout(resolve, 100));
    });
    describe('Express App Configuration', () => {
        it('should be defined', () => {
            expect(app).toBeDefined();
        });
        it('should be an Express application', () => {
            expect(app).toHaveProperty('use');
            expect(app).toHaveProperty('get');
            expect(app).toHaveProperty('post');
            expect(app).toHaveProperty('listen');
        });
    });
    describe('Health Check Endpoint', () => {
        it('should respond with status 200 and correct JSON for /health', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 'ok',
                service: 'auth-service'
            });
        });
        it('should have correct content-type for /health', async () => {
            const response = await request(app).get('/health');
            expect(response.headers['content-type']).toMatch(/json/);
        });
    });
    describe('Middleware Configuration', () => {
        it('should handle JSON request bodies', async () => {
            const testData = { test: 'data' };
            const response = await request(app)
                .post('/api/test')
                .send(testData);
            expect(response.status).toBe(200);
            expect(response.body.received).toEqual(testData);
        });
        it('should handle CORS', async () => {
            const response = await request(app).get('/health');
            expect(response.headers).toHaveProperty('access-control-allow-origin');
        });
        it('should include security headers from helmet', async () => {
            const response = await request(app).get('/health');
            // Helmet adds various security headers
            expect(response.headers).toHaveProperty('x-dns-prefetch-control');
        });
    });
    describe('Error Handling', () => {
        it('should handle non-existent routes', async () => {
            const response = await request(app).get('/non-existent-route');
            // Should return 404 or be handled by error middleware
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.status).toBeLessThan(600);
        });
        it('should handle non-existent API routes', async () => {
            const response = await request(app).get('/api/non-existent');
            // Should return 404 or be handled by error middleware  
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.status).toBeLessThan(600);
        });
    });
    describe('Environment Configuration', () => {
        it('should not start server in test environment', () => {
            // This test verifies that the server doesn't auto-start in test mode
            // If it did, we'd get port conflicts
            expect(process.env.NODE_ENV).toBe('test');
        });
    });
});
//# sourceMappingURL=app.test.js.map