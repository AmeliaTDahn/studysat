import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'success';
  size?: 'default' | 'sm' | 'lg';
}

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    success: 'bg-green-600 text-white hover:bg-green-700'
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...props}
    />
  );
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

export function Alert({
  className = '',
  variant = 'default',
  ...props
}: AlertProps) {
  const variants = {
    default: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive'
  };

  return (
    <div
      role="alert"
      className={`rounded-lg p-4 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max: number;
}

export function ProgressBar({
  value,
  max,
  className = '',
  ...props
}: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`relative overflow-hidden ${className}`}
      {...props}
    />
  );
} 