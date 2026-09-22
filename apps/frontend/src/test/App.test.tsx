import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { StatusBadge } from '../components/StatusBadge';

describe('PulseCommerce Frontend Application', () => {
  it('renders navbar and application title', () => {
    render(<App />);
    expect(screen.getByText('PulseCommerce')).toBeInTheDocument();
    expect(screen.getByText('OMS Core')).toBeInTheDocument();
  });

  it('renders command center dashboard by default', () => {
    render(<App />);
    expect(screen.getByText('Operations Command Center')).toBeInTheDocument();
    expect(screen.getByText('Live Fulfillment Stream')).toBeInTheDocument();
  });

  it('renders status badges with appropriate styles', () => {
    const { rerender } = render(<StatusBadge status="CONFIRMED" />);
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();

    rerender(<StatusBadge status="PENDING" />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();

    rerender(<StatusBadge status="CANCELLED" />);
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });
});
