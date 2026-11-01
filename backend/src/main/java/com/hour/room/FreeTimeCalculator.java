package com.hour.room;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class FreeTimeCalculator {

    private FreeTimeCalculator() {}

    public record Interval(LocalDateTime start, LocalDateTime end) {}

    public record Slot(LocalTime start, LocalTime end) {}

    public record DayFreeTime(LocalDate date, List<Slot> slots) {}

    public static List<DayFreeTime> calculate(List<Interval> busy, LocalDate weekStart, int days,
                                              int dayStartMinute, int dayEndMinute, int minMinutes) {
        List<DayFreeTime> result = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate date = weekStart.plusDays(i);
            result.add(new DayFreeTime(date, freeSlotsOfDay(busy, date, dayStartMinute, dayEndMinute, minMinutes)));
        }
        return result;
    }

    static List<Slot> freeSlotsOfDay(List<Interval> busy, LocalDate date,
                                     int dayStartMinute, int dayEndMinute, int minMinutes) {
        LocalDateTime windowStart = date.atStartOfDay().plusMinutes(dayStartMinute);
        LocalDateTime windowEnd = date.atStartOfDay().plusMinutes(dayEndMinute);

        List<Interval> clipped = new ArrayList<>();
        for (Interval b : busy) {
            LocalDateTime s = b.start().isAfter(windowStart) ? b.start() : windowStart;
            LocalDateTime e = b.end().isBefore(windowEnd) ? b.end() : windowEnd;
            if (s.isBefore(e)) {
                clipped.add(new Interval(s, e));
            }
        }
        clipped.sort(Comparator.comparing(Interval::start));

        List<Slot> slots = new ArrayList<>();
        LocalDateTime cursor = windowStart;
        for (Interval b : clipped) {
            if (b.start().isAfter(cursor)) {
                addIfLongEnough(slots, cursor, b.start(), minMinutes);
            }
            if (b.end().isAfter(cursor)) {
                cursor = b.end();
            }
        }
        addIfLongEnough(slots, cursor, windowEnd, minMinutes);
        return slots;
    }

    private static void addIfLongEnough(List<Slot> slots, LocalDateTime start, LocalDateTime end, int minMinutes) {
        if (Duration.between(start, end).toMinutes() >= minMinutes) {
            slots.add(new Slot(start.toLocalTime(), end.toLocalTime()));
        }
    }
}
