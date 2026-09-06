import { FormData, FieldDefinition, ListingFieldsConfig, CompletenessScore } from '@/types/listingFields';

/**
 * Calculate form completeness score and identify missing fields
 */
export const calculateCompleteness = (
    formData: FormData,
    config: ListingFieldsConfig
): CompletenessScore => {
    const allFields = config.groups.flatMap(g => g.fields);

    const requiredFields = allFields
        .filter(f => f.importance === 'required')
        .filter(f => shouldDisplayField(f, formData));

    const recommendedFields = allFields
        .filter(f => f.importance === 'recommended')
        .filter(f => shouldDisplayField(f, formData));

    const isFieldFilled = (field: FieldDefinition): boolean => {
        const value = formData[field.name];

        if (value === undefined || value === null || value === '') {
            return false;
        }

        if (Array.isArray(value) && value.length === 0) {
            return false;
        }

        return true;
    };

    const filledRequired = requiredFields.filter(isFieldFilled);
    const filledRecommended = recommendedFields.filter(isFieldFilled);

    const requiredScore = requiredFields.length > 0
        ? (filledRequired.length / requiredFields.length) * 60
        : 60; // If no required fields, give full required score

    const recommendedScore = recommendedFields.length > 0
        ? (filledRecommended.length / recommendedFields.length) * 40
        : 40; // If no recommended fields, give full recommended score

    const missingRequired = requiredFields
        .filter(f => !isFieldFilled(f))
        .map(f => f.label);

    const missingRecommended = recommendedFields
        .filter(f => !isFieldFilled(f))
        .map(f => f.label);

    return {
        score: Math.round(requiredScore + recommendedScore),
        requiredFilled: filledRequired.length,
        requiredTotal: requiredFields.length,
        recommendedFilled: filledRecommended.length,
        recommendedTotal: recommendedFields.length,
        missingRequired,
        missingRecommended,
    };
};

/**
 * Validate a single field
 */
export const validateField = (
    field: FieldDefinition,
    value: any,
    language: 'zh' | 'en' = 'zh'
): string | null => {
    const isZh = language === 'zh';

    // Required validation
    if (field.importance === 'required') {
        if (value === undefined || value === null || value === '') {
            return isZh ? `${field.label}为必填项` : `${field.label} is required`;
        }
        if (Array.isArray(value) && value.length === 0) {
            return isZh ? `${field.label}为必填项` : `${field.label} is required`;
        }
    }

    // Type-specific validation
    if (value && field.validation) {
        const { min, max, pattern, custom } = field.validation;

        // Min/Max for numbers
        if (field.type === 'number' && typeof value === 'number') {
            if (min !== undefined && value < min) {
                return isZh ? `${field.label}不能小于${min}` : `${field.label} cannot be less than ${min}`;
            }
            if (max !== undefined && value > max) {
                return isZh ? `${field.label}不能大于${max}` : `${field.label} cannot be more than ${max}`;
            }
        }

        // Min/Max for text length
        if ((field.type === 'text' || field.type === 'textarea') && typeof value === 'string') {
            if (min !== undefined && value.length < min) {
                return isZh ? `${field.label}至少需要${min}个字符` : `${field.label} needs at least ${min} characters`;
            }
            if (max !== undefined && value.length > max) {
                return isZh ? `${field.label}不能超过${max}个字符` : `${field.label} cannot exceed ${max} characters`;
            }
        }

        // Min/Max for arrays
        if (Array.isArray(value)) {
            if (min !== undefined && value.length < min) {
                return isZh ? `${field.label}至少需要${min}项` : `${field.label} needs at least ${min}`;
            }
            if (max !== undefined && value.length > max) {
                return isZh ? `${field.label}不能超过${max}项` : `${field.label} cannot exceed ${max}`;
            }
        }

        // Pattern validation
        if (pattern && typeof value === 'string') {
            if (!pattern.test(value)) {
                return isZh ? `${field.label}格式不正确` : `${field.label} format is invalid`;
            }
        }

        // Custom validation
        if (custom) {
            const result = custom(value);
            if (result !== true) {
                return typeof result === 'string' ? result : (isZh ? `${field.label}验证失败` : `${field.label} failed validation`);
            }
        }
    }

    return null;
};

/**
 * Validate all fields in the form
 */
export const validateAll = (
    formData: FormData,
    config: ListingFieldsConfig,
    language: 'zh' | 'en' = 'zh'
): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    const allFields = config.groups.flatMap(g => g.fields);

    for (const field of allFields) {
        // Check conditional display
        if (field.conditional) {
            const { dependsOn, value: condValue, operator = 'equals' } = field.conditional;
            const dependValue = formData[dependsOn];

            let shouldDisplay = false;
            switch (operator) {
                case 'equals':
                    shouldDisplay = dependValue === condValue;
                    break;
                case 'notEquals':
                    shouldDisplay = dependValue !== condValue;
                    break;
                case 'includes':
                    shouldDisplay = Array.isArray(dependValue) && dependValue.includes(condValue);
                    break;
                case 'greaterThan':
                    shouldDisplay = dependValue > condValue;
                    break;
                case 'lessThan':
                    shouldDisplay = dependValue < condValue;
                    break;
            }

            if (!shouldDisplay) {
                // Skip validation for hidden fields
                continue;
            }
        }

        const error = validateField(field, formData[field.name], language);
        if (error) {
            errors[field.name] = error;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Check if a field should be displayed based on conditional logic
 */
export const shouldDisplayField = (
    field: FieldDefinition,
    formData: FormData
): boolean => {
    if (!field.conditional) {
        return true;
    }

    const { dependsOn, value: condValue, operator = 'equals' } = field.conditional;
    const dependValue = formData[dependsOn];

    switch (operator) {
        case 'equals':
            return dependValue === condValue;
        case 'notEquals':
            return dependValue !== condValue;
        case 'includes':
            return Array.isArray(dependValue) && dependValue.includes(condValue);
        case 'greaterThan':
            return dependValue > condValue;
        case 'lessThan':
            return dependValue < condValue;
        default:
            return true;
    }
};
