-- Record-only migration (applied via `supabase db query --linked --file`).
--
-- Bug: two separate AFTER INSERT triggers on `reviews` both awarded beans,
-- and one of them was mislabeled:
--   - process_review_bean_reward() (on_review_created_award_beans) read the
--     configurable jinbean_rules.REVIEW_REWARD amount (10) but never
--     checked NEW.is_neighbor_story, despite the rule's own description
--     being "Reward for posting a neighbor story (review)" — so it fired
--     (and labeled the transaction "Neighbor Story reward") on every review,
--     including plain ones.
--   - reward_beans_for_review() (on_review_reward) hardcoded 50 beans,
--     gated correctly on is_neighbor_story, but duplicated the reward via a
--     direct UPDATE/INSERT instead of the shared record_bean_transaction()
--     helper.
-- Net effect: a genuine neighbor-story review paid out 10 + 50 = 60 beans
-- from two separate transactions, while the app's own UI (ReviewSubmission
-- .tsx, LeaveReview.tsx) only ever promises "Earn 50 JinBeans Reward".
--
-- Fix: keep a single reward path, driven by the configurable rule.
UPDATE public.jinbean_rules SET amount = 50 WHERE rule_id = 'REVIEW_REWARD';

CREATE OR REPLACE FUNCTION public.process_review_bean_reward()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_reward INTEGER;
BEGIN
    IF NEW.is_neighbor_story THEN
        v_reward := public.get_bean_rule_amount('REVIEW_REWARD');

        IF v_reward > 0 THEN
            PERFORM public.record_bean_transaction(
                NEW.buyer_id,
                v_reward,
                'REVIEW',
                '发布邻里故事奖励',
                'Neighbor Story reward',
                NEW.order_id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_review_reward ON public.reviews;
DROP FUNCTION IF EXISTS public.reward_beans_for_review();
