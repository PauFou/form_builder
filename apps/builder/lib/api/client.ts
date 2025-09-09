// Mock API client for development
// TODO: Replace with actual API client

class MockApiClient {
  async get(url: string, options?: any) {
    console.log('Mock GET:', url, options);
    
    // Mock responses
    if (url === '/forms') {
      return {
        data: {
          forms: [
            {
              id: '1',
              title: 'Customer Feedback Survey',
              description: 'Collect customer feedback',
              status: 'published',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-15')
            },
            {
              id: '2',
              title: 'Event Registration',
              description: 'Register for our upcoming event',
              status: 'draft',
              createdAt: new Date('2024-01-10'),
              updatedAt: new Date('2024-01-20')
            }
          ],
          total: 2,
          page: 1,
          limit: 10
        }
      };
    }
    
    if (url.startsWith('/forms/') && !url.includes('/')) {
      const id = url.split('/')[2];
      return {
        data: {
          id,
          title: 'Sample Form',
          description: 'This is a sample form',
          pages: [
            {
              id: 'page-1',
              title: 'Page 1',
              blocks: []
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
    }
    
    return { data: null };
  }
  
  async post(url: string, data?: any) {
    console.log('Mock POST:', url, data);
    return { data: { ...data, id: crypto.randomUUID() } };
  }
  
  async put(url: string, data?: any) {
    console.log('Mock PUT:', url, data);
    return { data: { ...data, updatedAt: new Date() } };
  }
  
  async delete(url: string) {
    console.log('Mock DELETE:', url);
    return { data: { success: true } };
  }
}

export const apiClient = new MockApiClient();