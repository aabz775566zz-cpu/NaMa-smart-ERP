import * as React from 'react';

import { cn } from '../../lib/utils';
import { Label } from './label';

// Deliberately minimal — label + description/error + children composition,
// no validation engine. A full react-hook-form + zod integration is a
// reasonable future addition once real multi-field forms are being built
// (Products create/edit, etc.), not part of this foundation pass.
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, htmlFor, description, error, required, children, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-1.5', className)} {...props}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="ms-1 text-destructive">*</span> : null}
        </Label>
      ) : null}
      {children}
      {description && !error ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  ),
);
FormField.displayName = 'FormField';

export { FormField };
