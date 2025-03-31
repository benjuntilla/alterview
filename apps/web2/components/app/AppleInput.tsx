"use client";

import React, { useState, InputHTMLAttributes, forwardRef, useEffect } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  "w-full px-4 bg-transparent outline-none transition-all duration-200",
  {
    variants: {
      variant: {
        default: "rounded-xl border border-gray-200 focus:border-alterview-indigo focus:shadow-sm",
        minimal: "border-b border-gray-200 focus:border-alterview-indigo px-0",
        pill: "rounded-full border border-gray-200 focus:border-alterview-indigo focus:shadow-sm",
      },
      inputSize: {
        default: "text-base",
        sm: "text-sm py-2",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface AppleInputProps 
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  showFocusEffect?: boolean;
}

const AppleInput = forwardRef<HTMLInputElement, AppleInputProps>(
  ({ 
    className, 
    variant, 
    inputSize, 
    label, 
    icon, 
    error, 
    showFocusEffect = false,
    placeholder,
    value,
    defaultValue,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value || !!defaultValue);
    const [inputValue, setInputValue] = useState<string>(
      (value !== undefined ? String(value) : '') || 
      (defaultValue !== undefined ? String(defaultValue) : '')
    );

    // Update hasValue state when value prop changes
    useEffect(() => {
      if (value !== undefined) {
        const stringValue = String(value);
        setInputValue(stringValue);
        setHasValue(!!stringValue);
      }
    }, [value]);

    // Determine if the label should float
    const shouldFloatLabel = isFocused || hasValue;

    // Only show placeholder when input is focused and empty
    const dynamicPlaceholder = "";

    // Handle the value change to track if there's content
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setHasValue(!!newValue);
      props.onChange?.(e);
    };

    return (
      <div className="relative w-full mb-2">
        {/* Label (if provided) */}
        {label && (
          <label 
            className={cn(
              "absolute left-4 transition-all duration-200 pointer-events-none z-10",
              shouldFloatLabel 
                ? "transform -translate-y-7 scale-80 text-alterview-indigo text-sm top-1 origin-left" 
                : "text-gray-500 top-3.5"
            )}
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className={cn(
          "relative",
          showFocusEffect && isFocused && "ring-1 ring-alterview-indigo/20 rounded-xl"
        )}>
          {/* Icon (if provided) */}
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}

          {/* The input element */}
          <input
            className={cn(
              inputVariants({ variant, inputSize }),
              icon && "pl-10",
              error && "border-red-500",
              shouldFloatLabel ? "pt-5 pb-3" : "py-2.5",
              className
            )}
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            placeholder={dynamicPlaceholder}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={handleChange}
            {...props}
          />

          {/* Focus effect (similar to iOS) */}
          {showFocusEffect && isFocused && (
            <div className="absolute left-0 right-0 -bottom-1.5 h-0.5 bg-alterview-indigo rounded-full mx-4 animate-scaleX" />
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </div>
    );
  }
);

AppleInput.displayName = "AppleInput";

export { AppleInput }; 