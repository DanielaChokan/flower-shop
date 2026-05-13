import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/modules/cart/CartContext", () => ({
  useCart: vi.fn(),
}));

vi.mock("@/modules/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/modules/favourites/FavouritesContext", () => ({
  useFavourites: vi.fn(),
}));

import { useCart } from "@/modules/cart/CartContext";
import { useAuth } from "@/modules/auth/AuthContext";
import { useFavourites } from "@/modules/favourites/FavouritesContext";
import ProductCard from "@/components/product/ProductCard";

const mockAddItem = vi.fn();
const mockOpenAuth = vi.fn();
const mockToggleFavourite = vi.fn();

const defaultProps = {
  id: "1",
  name: "Троянда",
  price: 150,
  image: "/rose.jpg",
  rating: 4,
};

function setupMocks(overrides: { user?: object | null } = {}) {
  (useCart as ReturnType<typeof vi.fn>).mockReturnValue({ addItem: mockAddItem });
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: overrides.user !== undefined ? overrides.user : { uid: "123" },
    openAuth: mockOpenAuth,
  });
  (useFavourites as ReturnType<typeof vi.fn>).mockReturnValue({
    isFavourite: () => false,
    toggleFavourite: mockToggleFavourite,
  });
}

describe("ProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product name and price", () => {
    setupMocks();
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText("Троянда")).toBeInTheDocument();
    expect(screen.getByText("150 грн.")).toBeInTheDocument();
  });

  it("renders star rating", () => {
    setupMocks();
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText("★★★★☆")).toBeInTheDocument();
  });

  it("calls addItem when authenticated user clicks add to cart", () => {
    setupMocks();
    render(<ProductCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Додати до кошика"));
    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", name: "Троянда", price: 150 })
    );
  });

  it("opens auth modal when unauthenticated user clicks add to cart", () => {
    setupMocks({ user: null });
    render(<ProductCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Додати до кошика"));
    expect(mockOpenAuth).toHaveBeenCalled();
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it("opens auth modal when unauthenticated user clicks favourite", () => {
    setupMocks({ user: null });
    render(<ProductCard {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Додати до обраного"));
    expect(mockOpenAuth).toHaveBeenCalled();
    expect(mockToggleFavourite).not.toHaveBeenCalled();
  });

  it("toggles favourite when authenticated user clicks heart", () => {
    setupMocks();
    render(<ProductCard {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Додати до обраного"));
    expect(mockToggleFavourite).toHaveBeenCalledWith("1");
  });

  it("renders AI Букет badge for custom items", () => {
    setupMocks();
    render(<ProductCard {...defaultProps} isCustom />);
    expect(screen.getByText("AI Букет")).toBeInTheDocument();
  });

  it("shows quantity controls when inCart=true", () => {
    setupMocks();
    render(<ProductCard {...defaultProps} inCart quantity={2} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByLabelText("Зменшити кількість")).toBeInTheDocument();
    expect(screen.getByLabelText("Збільшити кількість")).toBeInTheDocument();
  });

  it("disables increment button when quantity equals stock", () => {
    setupMocks();
    render(<ProductCard {...defaultProps} inCart quantity={3} stock={3} />);
    const increaseBtn = screen.getByLabelText("Збільшити кількість");
    expect(increaseBtn).toBeDisabled();
  });

  it("calls onQuantityChange with incremented value", () => {
    setupMocks();
    const onQuantityChange = vi.fn();
    render(<ProductCard {...defaultProps} inCart quantity={2} onQuantityChange={onQuantityChange} />);
    fireEvent.click(screen.getByLabelText("Збільшити кількість"));
    expect(onQuantityChange).toHaveBeenCalledWith(3);
  });

  it("calls onQuantityChange with decremented value", () => {
    setupMocks();
    const onQuantityChange = vi.fn();
    render(<ProductCard {...defaultProps} inCart quantity={2} onQuantityChange={onQuantityChange} />);
    fireEvent.click(screen.getByLabelText("Зменшити кількість"));
    expect(onQuantityChange).toHaveBeenCalledWith(1);
  });

  it("shows stock limit message when quantity equals stock", () => {
    setupMocks();
    render(<ProductCard {...defaultProps} inCart quantity={5} stock={5} />);
    expect(screen.getByText("Це максимальна кількість в наявності")).toBeInTheDocument();
  });
});

describe("getStars (via ProductCard rating display)", () => {
  beforeEach(() => {
    setupMocks();
  });

  it.each([
    [0, "☆☆☆☆☆"],
    [1, "★☆☆☆☆"],
    [3, "★★★☆☆"],
    [5, "★★★★★"],
  ])("rating %i renders %s", (rating, expected) => {
    render(<ProductCard {...defaultProps} rating={rating} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
