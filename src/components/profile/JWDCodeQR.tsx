import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useConfigStore } from '@/stores/configStore';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface JWDCodeQRProps {
    jwdCode: string;
    userId: string;
    userName: string;
}

export function JWDCodeQR({ jwdCode, userId, userName }: JWDCodeQRProps) {
    const { language } = useConfigStore();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(jwdCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // The data encoded in the QR code (JWD URI format)
    const qrValue = `jwd://user/${userId}?code=${jwdCode}`;

    return (
        <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-[32px] shadow-xl border border-primary/10">
            <div className="text-center">
                <h3 className="text-lg font-black tracking-tight text-primary uppercase">
                    {language === 'zh' ? '我的渥帮码' : 'My JWD Code'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                    {language === 'zh' ? '扫描此码添加我为邻居' : 'Scan to add as neighbor'}
                </p>
            </div>

            {/* QR Code Container with custom styling */}
            <div className="p-4 bg-white rounded-2xl shadow-inner border-2 border-primary/5 relative">
                <QRCodeSVG
                    value={qrValue}
                    size={200}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                        src: "/logo.png", // Assuming logo.png exists, adjust if needed
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                    }}
                />
            </div>

            <div className="w-full flex flex-col items-center gap-2">
                <div
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full transition-all cursor-pointer group"
                >
                    <span className="text-sm font-mono font-bold tracking-widest text-primary">
                        {jwdCode}
                    </span>
                    {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4 text-primary/40 group-hover:text-primary transition-colors" />
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                    {language === 'zh' ? '点击复制我的专属 ID' : 'Click to copy your unique ID'}
                </p>
            </div>
        </div>
    );
}
