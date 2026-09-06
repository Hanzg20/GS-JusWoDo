import React, { useState, useEffect } from 'react';
import { ListingFieldsConfig, FormData, FormErrors } from '@/types/listingFields';
import { calculateCompleteness, validateAll, shouldDisplayField } from '@/utils/formValidation';
import FormFieldRenderer from './FormFieldRenderer';
import CompletenessIndicator from './CompletenessIndicator';
import { Button } from '@/components/ui/button';
import { useConfigStore } from '@/stores/configStore';

interface DynamicListingFormProps {
    config: ListingFieldsConfig;
    initialData?: FormData;
    onSubmit: (data: FormData) => void;
    onCancel?: () => void;
    submitLabel?: string;
}

const DynamicListingForm: React.FC<DynamicListingFormProps> = ({
    config,
    initialData = {},
    onSubmit,
    onCancel,
    submitLabel
}) => {
    const { language } = useConfigStore();
    const resolvedSubmitLabel = submitLabel ?? (language === 'zh' ? '✨ 确认发布' : '✨ Confirm & Publish');
    // Initialize formData with all fields from config to avoid uncontrolled -> controlled warnings
    const [formData, setFormData] = useState<FormData>(() => {
        const data = { ...initialData };
        config.groups.forEach(group => {
            group.fields.forEach(field => {
                if (data[field.name] === undefined) {
                    // Use suitable defaults based on type
                    if (field.type === 'checkbox' && field.multiple) data[field.name] = [];
                    else if (field.type === 'images') data[field.name] = [];
                    else if (field.type === 'sku-list') data[field.name] = [];
                    else data[field.name] = '';
                }
            });
        });
        return data;
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate completeness when form data changes
    const completeness = calculateCompleteness(formData, config);

    // Auto-save to localStorage
    useEffect(() => {
        const saveTimeout = setTimeout(() => {
            localStorage.setItem('listing-draft', JSON.stringify(formData));
        }, 1000);

        return () => clearTimeout(saveTimeout);
    }, [formData]);

    // Update form data when initialData changes (e.g. restoring from preview)
    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            setFormData(prev => ({
                ...prev,
                ...initialData
            }));
        }
    }, [initialData]);

    const handleFieldChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async () => {
        // Validate all fields
        const validation = validateAll(formData, config, language);

        if (!validation.isValid) {
            setErrors(validation.errors);
            // Scroll to first error
            const firstErrorField = Object.keys(validation.errors)[0];
            const element = document.getElementById(`field-${firstErrorField}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            // Clear draft on successful submit
            localStorage.removeItem('listing-draft');
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Completeness Indicator */}
            <CompletenessIndicator score={completeness} />

            {/* Field Groups */}
            {config.groups.map((group, groupIndex) => (
                <div key={groupIndex} className="bg-card border rounded-2xl p-6 space-y-5">
                    <div>
                        <h3 className="text-lg font-black mb-1">{group.title}</h3>
                        {group.description && (
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        {group.fields.map(field => {
                            // Check if field should be displayed
                            if (!shouldDisplayField(field, formData)) {
                                return null;
                            }

                            return (
                                <div key={field.name} id={`field-${field.name}`}>
                                    <FormFieldRenderer
                                        field={field}
                                        value={formData[field.name]}
                                        error={errors[field.name]}
                                        onChange={(value) => handleFieldChange(field.name, value)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-2xl border shadow-lg">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1"
                        disabled={isSubmitting}
                    >
                        {language === 'zh' ? '取消' : 'Cancel'}
                    </Button>
                )}
                <Button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-[2] btn-action"
                    disabled={isSubmitting || completeness.missingRequired.length > 0}
                >
                    {isSubmitting ? (language === 'zh' ? '提交中...' : 'Submitting...') : resolvedSubmitLabel}
                </Button>
            </div>

            {/* Missing Required Fields Warning */}
            {completeness.missingRequired.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-bold text-red-700">
                        {language === 'zh'
                            ? `⚠️ 还有 ${completeness.missingRequired.length} 个必填项未完成`
                            : `⚠️ ${completeness.missingRequired.length} required field${completeness.missingRequired.length > 1 ? 's' : ''} left`}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DynamicListingForm;
