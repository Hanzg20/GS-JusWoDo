/**
 * 🔧 快速实时消息诊断工具
 *
 * 使用方法:
 * 1. 打开浏览器控制台 (F12)
 * 2. 复制整个文件内容
 * 3. 粘贴到控制台并回车
 * 4. 查看诊断结果
 */

(async function diagnoseRealtimeMessaging() {
    console.log('🔧 开始实时消息诊断...\n');

    const results = {
        passed: [],
        failed: [],
        warnings: []
    };

    // ===== 检查 1: Supabase 客户端 =====
    console.log('📋 检查 1: Supabase 客户端初始化...');
    try {
        // @ts-ignore
        const { supabase } = await import('/src/lib/supabase');
        if (supabase) {
            results.passed.push('✅ Supabase 客户端已正确初始化');
        }
    } catch (e) {
        results.failed.push('❌ Supabase 客户端初始化失败: ' + e.message);
    }

    // ===== 检查 2: 当前用户 =====
    console.log('\n📋 检查 2: 当前登录用户...');
    try {
        // @ts-ignore
        const { supabase } = await import('/src/lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            results.passed.push(`✅ 当前用户: ${user.email} (ID: ${user.id.slice(0, 8)}...)`);
            console.log('   用户 ID:', user.id);
        } else {
            results.failed.push('❌ 未登录');
        }
    } catch (e) {
        results.failed.push('❌ 获取用户信息失败: ' + e.message);
    }

    // ===== 检查 3: Conversations 数据访问 =====
    console.log('\n📋 检查 3: Conversations 表访问权限...');
    try {
        // @ts-ignore
        const { supabase } = await import('/src/lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('conversations')
            .select('id')
            .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
            .limit(1);

        if (error) {
            results.failed.push(`❌ Conversations 访问失败: ${error.message}`);
        } else {
            results.passed.push(`✅ Conversations 表可访问 (找到 ${data?.length || 0} 条记录)`);
        }
    } catch (e) {
        results.failed.push('❌ Conversations 查询异常: ' + e.message);
    }

    // ===== 检查 4: Messages 数据访问 =====
    console.log('\n📋 检查 4: Messages 表访问权限...');
    try {
        // @ts-ignore
        const { supabase } = await import('/src/lib/supabase');
        const { data, error } = await supabase
            .from('messages')
            .select('id')
            .limit(1);

        if (error) {
            results.failed.push(`❌ Messages 访问失败: ${error.message}`);
        } else {
            results.passed.push(`✅ Messages 表可访问`);
        }
    } catch (e) {
        results.failed.push('❌ Messages 查询异常: ' + e.message);
    }

    // ===== 检查 5: Realtime 订阅测试 =====
    console.log('\n📋 检查 5: Realtime 订阅功能...');
    try {
        // @ts-ignore
        const { supabase } = await import('/src/lib/supabase');

        const testPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('订阅超时 (5秒)'));
            }, 5000);

            const channel = supabase
                .channel('diagnostic-test-channel')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'messages'
                    },
                    (payload) => {
                        console.log('   📨 测试消息接收:', payload);
                    }
                )
                .subscribe((status, err) => {
                    console.log('   📡 订阅状态:', status);
                    if (status === 'SUBSCRIBED') {
                        clearTimeout(timeout);
                        supabase.removeChannel(channel);
                        resolve(status);
                    } else if (status === 'CHANNEL_ERROR') {
                        clearTimeout(timeout);
                        supabase.removeChannel(channel);
                        reject(err);
                    }
                });
        });

        await testPromise;
        results.passed.push('✅ Realtime 订阅功能正常');
    } catch (e) {
        results.failed.push('❌ Realtime 订阅失败: ' + e.message);
        results.warnings.push('⚠️  可能原因: Supabase Realtime 未启用或网络问题');
    }

    // ===== 检查 6: 活动对话 =====
    console.log('\n📋 检查 6: 当前活动对话...');
    try {
        // @ts-ignore
        const { useMessageStore } = await import('/src/stores/messageStore');
        const store = useMessageStore.getState();
        const activeConvId = store.activeConversationId;
        const messages = store.messages;

        if (activeConvId) {
            results.passed.push(`✅ 活动对话 ID: ${activeConvId.slice(0, 8)}...`);
            results.passed.push(`✅ 当前消息数: ${messages.length}`);
            console.log('   完整 Conversation ID:', activeConvId);
            console.log('   最近5条消息:', messages.slice(-5).map(m => ({
                id: m.id.slice(0, 8),
                sender: m.senderId.slice(0, 8),
                content: m.content.substring(0, 30)
            })));
        } else {
            results.warnings.push('⚠️  当前没有活动对话');
        }
    } catch (e) {
        results.warnings.push('⚠️  无法访问 MessageStore: ' + e.message);
    }

    // ===== 打印诊断结果 =====
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 诊断结果总结');
    console.log('='.repeat(60));

    if (results.passed.length > 0) {
        console.log('\n✅ 通过的检查:');
        results.passed.forEach(msg => console.log('  ' + msg));
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  警告:');
        results.warnings.forEach(msg => console.log('  ' + msg));
    }

    if (results.failed.length > 0) {
        console.log('\n❌ 失败的检查:');
        results.failed.forEach(msg => console.log('  ' + msg));
    }

    console.log('\n' + '='.repeat(60));

    if (results.failed.length === 0) {
        console.log('🎉 所有关键检查通过！');
        console.log('\n💡 下一步操作:');
        console.log('  1. 在另一个浏览器也运行此诊断');
        console.log('  2. 对比两个浏览器的 "活动对话 ID" 是否相同');
        console.log('  3. 如果 ID 不同,说明在不同对话中');
        console.log('  4. 如果 ID 相同但仍收不到消息,检查网络标签的 WebSocket 连接');
    } else {
        console.log('❗ 发现问题,请参考故障排查文档:');
        console.log('   docs/REALTIME_MESSAGE_TROUBLESHOOTING.md');
    }

    console.log('\n📋 要手动测试 Realtime,运行以下代码:');
    console.log(`
const { supabase } = await import('/src/lib/supabase');
const channel = supabase
    .channel('test-messages')
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
    }, (payload) => {
        console.log('📨 收到新消息:', payload);
    })
    .subscribe((status) => {
        console.log('📡 订阅状态:', status);
    });

// 5秒后取消订阅
setTimeout(() => {
    supabase.removeChannel(channel);
    console.log('🔴 已取消订阅');
}, 5000);
    `.trim());

    console.log('\n🔧 诊断完成\n');
})();
