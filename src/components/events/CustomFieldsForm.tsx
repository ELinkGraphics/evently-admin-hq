
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventCustomField } from '@/types/event';

type Props = {
  customFields: EventCustomField[];
  fieldValues: Record<string, string>;
  setFieldValues: (values: Record<string, string>) => void;
  disabled?: boolean;
};

export const CustomFieldsForm = ({ customFields, fieldValues, setFieldValues, disabled }: Props) => {
  if (!customFields.length) return null;

  return (
    <div className="space-y-4">
      {customFields.map((field) => {
        const value = fieldValues[field.field_name] || '';
        const id = `custom_${field.field_name}`;

        if (field.field_type === 'select' && Array.isArray(field.field_options)) {
          return (
            <div key={field.id}>
              <Label htmlFor={id}>{field.field_label}{field.is_required ? ' *' : ''}</Label>
              <select
                id={id}
                value={value}
                onChange={e =>
                  setFieldValues({
                    ...fieldValues,
                    [field.field_name]: e.target.value,
                  })
                }
                required={field.is_required}
                disabled={disabled}
                className="block w-full p-2 border rounded"
              >
                <option value="">Select...</option>
                {field.field_options.map((opt: any, idx: number) => (
                  <option key={idx} value={opt.value || opt}>{opt.label || opt}</option>
                ))}
              </select>
            </div>
          );
        }

        if (field.field_type === 'textarea') {
          return (
            <div key={field.id}>
              <Label htmlFor={id}>{field.field_label}{field.is_required ? ' *' : ''}</Label>
              <textarea
                id={id}
                value={value}
                onChange={e =>
                  setFieldValues({
                    ...fieldValues,
                    [field.field_name]: e.target.value,
                  })
                }
                required={field.is_required}
                disabled={disabled}
                className="block w-full p-2 border rounded min-h-[80px]"
              />
            </div>
          );
        }

        return (
          <div key={field.id}>
            <Label htmlFor={id}>{field.field_label}{field.is_required ? ' *' : ''}</Label>
            <Input
              id={id}
              type={field.field_type}
              value={value}
              onChange={(e) =>
                setFieldValues({
                  ...fieldValues,
                  [field.field_name]: e.target.value,
                })
              }
              required={field.is_required}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );
};
