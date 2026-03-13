import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'

// Mock product card component (you'll need to create this)
const ProductCard = ({ product, onAddToCart, onAddToWishlist }: any) => (
  <div data-testid="product-card">
    <h3>{product.name}</h3>
    <p>R{product.price}</p>
    <p>{product.description}</p>
    <button onClick={() => onAddToCart(product)} data-testid="add-to-cart">
      Add to Cart
    </button>
    <button onClick={() => onAddToWishlist(product)} data-testid="add-to-wishlist">
      Add to Wishlist
    </button>
  </div>
)

const renderWithRouter = (component: React.ReactElement) => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: component,
    },
  ])
  return render(<RouterProvider router={router} />)
}

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 99.99,
    description: 'Test description',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
  }

  const mockOnAddToCart = vi.fn()
  const mockOnAddToWishlist = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product information correctly', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    )

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('R99.99')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('calls onAddToCart when add to cart button is clicked', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    )

    const addToCartButton = screen.getByTestId('add-to-cart')
    fireEvent.click(addToCartButton)

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct)
    expect(mockOnAddToCart).toHaveBeenCalledTimes(1)
  })

  it('calls onAddToWishlist when add to wishlist button is clicked', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    )

    const addToWishlistButton = screen.getByTestId('add-to-wishlist')
    fireEvent.click(addToWishlistButton)

    expect(mockOnAddToWishlist).toHaveBeenCalledWith(mockProduct)
    expect(mockOnAddToWishlist).toHaveBeenCalledTimes(1)
  })

  it('displays product card with correct test id', () => {
    renderWithRouter(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onAddToWishlist={mockOnAddToWishlist}
      />
    )

    expect(screen.getByTestId('product-card')).toBeInTheDocument()
  })
})