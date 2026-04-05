import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardContent } from '../components/ui/Card';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders button with icon', () => {
    render(<Button>
      <span>+</span>
      Add Item
    </Button>);
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
  });

  it('handles click event', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Secondary');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Danger');
  });
});

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
  });

  it('handles change event', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with label', () => {
    render(
      <>
        <label htmlFor="input">Label</label>
        <Input id="input" />
      </>
    );
    expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Badge variant="gray">Gray</Badge>);
    expect(screen.getByText('Gray')).toHaveClass('bg-slate-100');

    rerender(<Badge variant="blue">Blue</Badge>);
    expect(screen.getByText('Blue')).toHaveClass('bg-blue-50');

    rerender(<Badge variant="green">Green</Badge>);
    expect(screen.getByText('Green')).toHaveClass('bg-emerald-50');

    rerender(<Badge variant="red">Red</Badge>);
    expect(screen.getByText('Red')).toHaveClass('bg-red-50');
  });
});

describe('Avatar', () => {
  it('renders avatar with initials', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders question mark for empty name', () => {
    render(<Avatar name="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Avatar name="Test" size={32} />);
    expect(screen.getAllByText('T').length).toBeGreaterThan(0);

    rerender(<Avatar name="Other" size={64} />);
    expect(screen.getAllByText('O').length).toBeGreaterThan(0);
  });
});

describe('Card', () => {
  it('renders card with content', () => {
    render(
      <Card>
        <CardContent>Card content</CardContent>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with hover effect', () => {
    const { container } = render(<Card hover>Hover me</Card>);
    const card = container.querySelector('[class*="transition"]');
    expect(card).toBeInTheDocument();
  });
});
