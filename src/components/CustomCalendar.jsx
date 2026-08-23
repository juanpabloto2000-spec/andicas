import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_NAMES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

export default function CustomCalendar({ 
  mode = "range", // "range" | "single"
  startDate,
  endDate,
  onRangeChange,
  singleDate,
  onSingleDateChange,
  blockedDates = [],
  compact = false,
  className = "" 
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Days calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    clickedDate.setHours(0, 0, 0, 0);

    if (clickedDate < today) return; // Cannot pick past dates

    const dateStr = clickedDate.toISOString().split('T')[0];

    if (mode === "single") {
      if (onSingleDateChange) onSingleDateChange(dateStr);
    } else {
      // Range mode
      if (!startDate || (startDate && endDate)) {
        // Start fresh range
        if (onRangeChange) onRangeChange({ startDate: dateStr, endDate: null });
      } else if (startDate && !endDate) {
        const start = new Date(startDate);
        if (clickedDate < start) {
          if (onRangeChange) onRangeChange({ startDate: dateStr, endDate: null });
        } else if (clickedDate.getTime() === start.getTime()) {
          if (onRangeChange) onRangeChange({ startDate: dateStr, endDate: null });
        } else {
          if (onRangeChange) onRangeChange({ startDate, endDate: dateStr });
        }
      }
    }
  };

  // Calculate nights
  let nightCount = 0;
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    nightCount = Math.round((e - s) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className={`rounded-xl sm:rounded-2xl glass-dark border border-gold-500/30 text-linen-100 shadow-xl ${
      compact ? 'p-2 sm:p-4' : 'p-3.5 sm:p-5'
    } ${className}`}>
      {/* Calendar Header */}
      <div className={`flex items-center justify-between border-b border-white/10 ${
        compact ? 'pb-1.5 mb-1.5' : 'pb-3 mb-3'
      }`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded-md bg-gold-500/20 text-gold-400 flex-shrink-0">
            <CalendarIcon className={compact ? "w-3 h-3" : "w-4 h-4"} />
          </div>
          <div className="min-w-0">
            <h4 className={`font-display font-black text-linen-100 uppercase tracking-wide leading-tight truncate ${
              compact ? 'text-[10px] sm:text-sm' : 'text-xs sm:text-base'
            }`}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={currentYear === today.getFullYear() && currentMonth <= today.getMonth()}
            className="p-1 rounded bg-jade-900 border border-white/10 hover:border-gold-400 disabled:opacity-20 disabled:pointer-events-none text-gold-300 cursor-pointer"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded bg-jade-900 border border-white/10 hover:border-gold-400 text-gold-300 cursor-pointer"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-0.5 text-center mb-0.5">
        {DAY_NAMES.map((d, i) => (
          <span key={i} className="text-[8px] sm:text-[10px] font-cartoon font-bold text-gold-400/80 py-0.5">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-0.5 gap-x-0.5 text-center text-xs">
        {/* Empty slots for offset */}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className={compact ? "h-5 sm:h-7" : "h-7 sm:h-9"} />
        ))}

        {/* Month days */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const thisDate = new Date(currentYear, currentMonth, day);
          thisDate.setHours(0, 0, 0, 0);
          const dateStr = thisDate.toISOString().split('T')[0];

          const isPast = thisDate < today;
          const isBlocked = blockedDates.includes(dateStr);
          const isToday = thisDate.getTime() === today.getTime();

          let isStart = false;
          let isEnd = false;
          let isInRange = false;
          let isSingleSelected = false;

          if (mode === "single") {
            isSingleSelected = singleDate === dateStr;
          } else {
            isStart = startDate === dateStr;
            isEnd = endDate === dateStr;
            if (startDate && endDate) {
              const s = new Date(startDate);
              const e = new Date(endDate);
              isInRange = thisDate > s && thisDate < e;
            }
          }

          return (
            <button
              key={day}
              type="button"
              disabled={isPast || isBlocked}
              onClick={() => handleDateClick(day)}
              title={isBlocked ? 'Fecha Ocupada / No Disponible' : ''}
              className={`w-full rounded font-medium text-[9px] sm:text-[11px] flex items-center justify-center transition-all relative ${
                compact ? 'h-5 sm:h-7' : 'h-7 sm:h-9'
              } ${
                isPast 
                  ? 'opacity-20 cursor-not-allowed text-linen-400'
                  : isBlocked
                  ? 'opacity-30 cursor-not-allowed bg-red-950/40 text-red-300 line-through border border-red-500/20'
                  : 'cursor-pointer hover:border-gold-400'
              } ${
                isStart || isEnd || isSingleSelected
                  ? 'bg-gold-500 text-jade-950 font-bold shadow-gold-glow scale-105 z-10'
                  : isInRange
                  ? 'bg-teal-900/90 text-gold-300 font-semibold border-y border-gold-500/30'
                  : isToday
                  ? 'border border-gold-400 text-gold-300 bg-jade-900/60'
                  : 'text-linen-200 hover:bg-white/10'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Range Status Bar */}
      {mode === "range" && nightCount > 0 && (
        <div className={`border-t border-white/10 flex items-center justify-between text-xs gap-1 ${
          compact ? 'mt-1.5 pt-1.5' : 'mt-3 pt-2.5'
        }`}>
          <div className="flex items-center gap-1 text-[8px] sm:text-[11px] font-fredoka text-gold-300 font-bold">
            <span className="truncate">{startDate}</span>
            <span>➔</span>
            <span className="truncate">{endDate}</span>
          </div>

          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gold-500/20 border border-gold-400 text-gold-300 text-[8px] sm:text-[10px] font-cartoon font-bold">
            <Sparkles className="w-2 h-2" />
            <span>{nightCount} {nightCount === 1 ? 'Noche' : 'Noches'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
