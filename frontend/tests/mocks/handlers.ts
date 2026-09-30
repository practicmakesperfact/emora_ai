import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth
  http.post('*/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      token_type: 'bearer',
    });
  }),
  
  // User
  http.get('*/users/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      role: { name: 'User' },
    });
  }),

  // Add more handlers here as needed for specific tests
];
