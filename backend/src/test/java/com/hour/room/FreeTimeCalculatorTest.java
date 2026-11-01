package com.hour.room;

import static org.assertj.core.api.Assertions.assertThat;

import com.hour.room.FreeTimeCalculator.Interval;
import com.hour.room.FreeTimeCalculator.Slot;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class FreeTimeCalculatorTest {

    private static final LocalDate DAY = LocalDate.of(2026, 10, 22);

    private static Interval busy(int startHour, int endHour) {
        return new Interval(DAY.atTime(startHour, 0), DAY.atTime(endHour, 0));
    }

    @Test
    void mergesOverlappingBusyTimesAndReturnsGaps() {
        List<Interval> busy = List.of(busy(10, 12), busy(11, 13), busy(15, 16));

        List<Slot> slots = FreeTimeCalculator.freeSlotsOfDay(busy, DAY, 9 * 60, 18 * 60, 30);

        assertThat(slots).containsExactly(
                new Slot(LocalTime.of(9, 0), LocalTime.of(10, 0)),
                new Slot(LocalTime.of(13, 0), LocalTime.of(15, 0)),
                new Slot(LocalTime.of(16, 0), LocalTime.of(18, 0)));
    }

    @Test
    void dropsGapsShorterThanMinimum() {
        List<Interval> busy = List.of(
                new Interval(DAY.atTime(9, 0), DAY.atTime(9, 50)),
                new Interval(DAY.atTime(10, 0), DAY.atTime(18, 0)));

        List<Slot> slots = FreeTimeCalculator.freeSlotsOfDay(busy, DAY, 9 * 60, 18 * 60, 30);

        assertThat(slots).isEmpty();
    }

    @Test
    void clipsMultiDayScheduleToEachDay() {
        List<Interval> busy = List.of(new Interval(DAY.minusDays(1).atTime(20, 0), DAY.atTime(8, 0)));

        List<Slot> slots = FreeTimeCalculator.freeSlotsOfDay(busy, DAY, 0, 24 * 60, 30);

        assertThat(slots).containsExactly(new Slot(LocalTime.of(8, 0), LocalTime.MIDNIGHT));
    }
}
