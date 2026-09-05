import { supabase } from '@/lib/supabase';

export type ReportTargetType = 'LISTING' | 'USER' | 'COMMUNITY_POST' | 'REVIEW';

class SupabaseReportRepository {
    async submitReport(report: {
        reporterId: string;
        targetType: ReportTargetType;
        targetId: string;
        reason: string;
        details?: string;
    }): Promise<void> {
        const { error } = await supabase
            .from('reports')
            .insert({
                reporter_id: report.reporterId,
                target_type: report.targetType,
                target_id: report.targetId,
                reason: report.reason,
                details: report.details || null
            });

        if (error) throw error;
    }
}

export const reportRepository = new SupabaseReportRepository();
