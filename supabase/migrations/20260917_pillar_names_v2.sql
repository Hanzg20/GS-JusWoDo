-- Homepage pillar Chinese labels reworked into punchier parallel
-- taglines (English unchanged per user request):
-- 本地服务 → 寻服务·找达人, 邻里圈 → 聊家常·助友邻 (was briefly proposed as
-- 讲故事·问友邻, revised after discussion — 讲故事 undersold the pillar's
-- actual mix of 求助/活动/公告 content; 助友邻 covers both giving and
-- receiving help, not just asking), 闲置 & 租赁 → 淘二手·租闲置.
UPDATE ref_codes SET zh_name = '寻服务·找达人' WHERE code_id = 'PILLAR_SERVICE';
UPDATE ref_codes SET zh_name = '聊家常·助友邻' WHERE code_id = 'PILLAR_HELP';
UPDATE ref_codes SET zh_name = '淘二手·租闲置' WHERE code_id = 'PILLAR_GOODS';
