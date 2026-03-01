import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded transition-all duration-300';

    const sizeStyles = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-3 text-lg',
    };

    const variantStyles = {
        primary: 'bg-primary text-white hover:bg-primary-dark shadow-soft',
        gradient: 'bg-gradient-to-r from-primary to-primary-dark text-white hover:opacity-90 shadow-md border border-primary-dark/20',
        outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
        ghost: 'text-slate-600 hover:text-primary hover:bg-slate-100',
        secondary: 'bg-secondary text-primary-dark hover:bg-secondary-light shadow-sm font-bold',
    };

    return (
        <button
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
