import React from 'react';
import { FieldDefinition } from '@/types/listingFields';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import ImageUploader from '@/components/common/ImageUploader';
import { useAuthStore } from '@/stores/authStore';
import SkuListEditor from './SkuListEditor';
import LocationPicker from '@/components/LocationPicker';

interface FormFieldRendererProps {
    field: FieldDefinition;
    value: any;
    error?: string;
    onChange: (value: any) => void;
}

const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
    field,
    value,
    error,
    onChange
}) => {
    const { currentUser } = useAuthStore();

    const renderField = () => {
        switch (field.type) {
            case 'text':
                return (
                    <Input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className={error ? 'border-red-500' : ''}
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        rows={field.rows || 4}
                        className={error ? 'border-red-500' : ''}
                    />
                );

            case 'number':
                return (
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                            type="number"
                            value={value || ''}
                            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                            placeholder={field.placeholder}
                            className={`pl-8 ${error ? 'border-red-500' : ''}`}
                            min={field.validation?.min}
                            max={field.validation?.max}
                        />
                    </div>
                );

            case 'select':
                return (
                    <Select value={value} onValueChange={onChange}>
                        <SelectTrigger className={error ? 'border-red-500' : ''}>
                            <SelectValue placeholder={field.placeholder || '请选择'} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    disabled={option.disabled}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'checkbox':
                if (field.multiple && field.options) {
                    // Multiple checkboxes
                    const selectedValues = Array.isArray(value) ? value : [];
                    return (
                        <div className="space-y-3">
                            {field.options.map(option => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${field.name}-${option.value}`}
                                        checked={selectedValues.includes(option.value)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                onChange([...selectedValues, option.value]);
                                            } else {
                                                onChange(selectedValues.filter(v => v !== option.value));
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor={`${field.name}-${option.value}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    );
                } else {
                    // Single checkbox
                    return (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id={field.name}
                                checked={value || false}
                                onCheckedChange={onChange}
                            />
                            <label
                                htmlFor={field.name}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {field.label}
                            </label>
                        </div>
                    );
                }

            case 'images':
                return (
                    <div className={error ? 'border border-red-500 rounded-xl p-4' : ''}>
                        <ImageUploader
                            bucketName="listing-media"
                            onUpload={onChange}
                            onUploadingChange={() => { }}
                            maxFiles={field.validation?.max || 6}
                            existingImages={Array.isArray(value) ? value : []}
                            folderPath={`listings/${currentUser?.id || 'anonymous'}`}
                        />
                    </div>
                );

            case 'location':
                return (
                    <LocationPicker
                        value={typeof value === 'object' ? value : undefined}
                        onChange={onChange}
                        showRadiusSelector={field.name === 'location' || field.name === 'pickupLocation'}
                        defaultRadius={10}
                    />
                );

            case 'datetime':
            case 'schedule':
                // Simple text input for now, can be enhanced with date/time picker
                return (
                    <Input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className={error ? 'border-red-500' : ''}
                    />
                );
            case 'sku-list':
                return (
                    <SkuListEditor
                        value={Array.isArray(value) ? value : []}
                        onChange={onChange}
                    />
                );

            default:
                return (
                    <Input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className={error ? 'border-red-500' : ''}
                    />
                );
        }
    };

    const getImportanceBadge = () => {
        if (field.importance === 'required') {
            return <span className="text-red-500">*</span>;
        }
        if (field.importance === 'recommended') {
            return <span className="text-yellow-500">⭐</span>;
        }
        return null;
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-1">
                {field.label}
                {getImportanceBadge()}
            </label>
            {renderField()}
            {field.helpText && !error && (
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};

export default FormFieldRenderer;
