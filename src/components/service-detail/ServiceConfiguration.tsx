import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Calendar as CalendarIcon, Info, Clock } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ListingMaster } from "@/types/domain";
import { useConfigStore } from "@/stores/configStore";

interface ServiceConfigurationProps {
    master: ListingMaster;
    dateRange: { from: Date; to?: Date } | undefined;
    setDateRange: (range: { from: Date; to?: Date } | undefined) => void;
    consultHours: number;
    setConsultHours: (val: number) => void;
}

export function ServiceConfiguration({
    master,
    dateRange,
    setDateRange,
    consultHours,
    setConsultHours
}: ServiceConfigurationProps) {
    const { language } = useConfigStore();
    const t = {
        rentalPeriod: language === 'zh' ? '租赁周期' : 'Rental Period',
        daysTotal: language === 'zh' ? '天总计' : 'Days Total',
        selectedDates: language === 'zh' ? '已选日期' : 'Selected Dates',
        pickRange: language === 'zh' ? '选择日期' : 'Pick a range',
        securityDeposit: language === 'zh' ? '归还后押金将全额退还。' : 'Security deposit is required and fully refundable after return.',
        duration: language === 'zh' ? '时长' : 'Duration',
        hours: language === 'zh' ? '小时' : 'Hours',
    };

    if (master.type === 'RENTAL') {
        return (
            <div className="card-warm p-6 mb-6 shadow-sm border-none bg-orange-50/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-foreground">
                        <CalendarIcon className="w-4 h-4 text-primary" /> {t.rentalPeriod}
                    </h3>
                    {dateRange?.from && dateRange?.to && (
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                            {differenceInDays(dateRange.to, dateRange.from) || 1} {t.daysTotal}
                        </span>
                    )}
                </div>

                <div className="grid gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-black h-16 rounded-2xl border-none bg-white shadow-sm hover:bg-white/80 transition-all px-4",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none">{t.selectedDates}</span>
                                            <span className="font-black text-foreground text-sm tracking-tight">
                                                {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd, y")}
                                            </span>
                                        </div>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span className="uppercase tracking-widest text-xs">{t.pickRange}</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-elevated rounded-3xl overflow-hidden" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                                disabled={(date) => date < new Date() || date < addDays(new Date(), -1)}
                                className="p-3"
                            />
                        </PopoverContent>
                    </Popover>
                    <div className="flex items-center gap-1.5 mt-2 ml-1 px-3 py-2 bg-orange-100/50 rounded-xl border border-orange-200/50">
                        <Info className="w-3 h-3 text-orange-600" />
                        <p className="text-[10px] font-bold text-orange-700 leading-tight">
                            {t.securityDeposit}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (master.type === 'CONSULTATION') {
        return (
            <div className="card-warm p-6 mb-6 shadow-sm border-none bg-blue-50/30">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-foreground">
                        <Clock className="w-4 h-4 text-primary" /> {t.duration}
                    </h3>
                    <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
                        {consultHours} {t.hours}
                    </span>
                </div>
                <div className="px-2">
                    <Slider
                        defaultValue={[consultHours]}
                        max={8}
                        min={1}
                        step={0.5}
                        onValueChange={(vals) => setConsultHours(vals[0])}
                        className="mb-6"
                    />
                    <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase opacity-50 px-1">
                        <span>1hr</span>
                        <span>2hr</span>
                        <span>4hr</span>
                        <span>8hr</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
