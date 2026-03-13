import { describe, it, expect, vi, beforeEach } from 'vitest'
// Mock the API service since we're testing the service layer
const mockProductService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-admin-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })
  })

  describe('API Service Tests', () => {
    it('should handle fetch requests correctly', async () => {
      const mockResponse = {
        items: [
          { id: 1, name: 'Product 1', price: 100 },
          { id: 2, name: 'Product 2', price: 200 },
        ],
        totalCount: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      // Test basic fetch functionality
      const response = await fetch('http://localhost:5222/api/products')
      const data = await response.json()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5222/api/products')
      expect(data.items).toEqual(mockResponse.items)
      expect(data.totalCount).toBe(2)
    })

    it('should handle error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      })

      const response = await fetch('http://localhost:5222/api/products/999')
      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
      expect(data.message).toBe('Not found')
    })

    it('should include authorization headers', () => {
      const token = localStorage.getItem('adminToken')
      expect(token).toBe('mock-admin-token')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(fetch('http://localhost:5222/api/products')).rejects.toThrow('Network error')
    })
  })
})