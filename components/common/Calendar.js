import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { mS, vS, rS } from "../../style/responsive";

const Calendar = ({ visible, onSelectDate, onClose }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Get days in month
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    // Convert to Bengali numerals
    const toBengaliNumeral = (num) => {
        const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return num.toString().split('').map(digit => bengaliNumerals[parseInt(digit)] || digit).join('');
    };

    // Generate calendar days organized by weeks
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = getFirstDayOfMonth(year, month);

        // Create a fixed 42-day array (6 weeks)
        const days = Array(42).fill(null);

        // Fill in the valid dates
        for (let day = 1; day <= daysInMonth; day++) {
            const index = firstDayOfMonth + day - 1;
            if (index < 42) { // Ensure we don't exceed array bounds
                days[index] = new Date(year, month, day);
            }
        }

        // Organize days into weeks (7 days per week)
        const weeks = [];
        for (let i = 0; i < 6; i++) {
            weeks.push(days.slice(i * 7, (i + 1) * 7));
        }

        return weeks;
    };

    // Add a helper function to safely compare dates
    const isSameDate = (date1, date2) => {
        if (!date1 || !date2) return false;
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    // Get month name in Bengali
    const getBengaliMonthName = (month) => {
        const bengaliMonths = [
            'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
            'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
        ];
        return bengaliMonths[month];
    };

    // Handle month navigation
    const prevMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        setCurrentMonth(newMonth);
    };

    const nextMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        setCurrentMonth(newMonth);
    };

    // Handle date selection
    const handleDateSelect = (date) => {
        if (date && date instanceof Date) {
            setSelectedDate(date);
            const formattedDate = formatDateToBengali(date);
            onSelectDate(formattedDate);
            onClose();
        }
    };

    // Format date to Bengali format
    const formatDateToBengali = (date) => {
        if (!date || !(date instanceof Date)) {
            return '';
        }
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${toBengaliNumeral(day)}-${toBengaliNumeral(month)}-${toBengaliNumeral(year)}`;
    };

    // Day name headers in Bengali
    const dayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={calendarStyles.modalOverlay}>
                <View style={calendarStyles.calendarContainer}>
                    {/* Header with month and year */}
                    <View style={calendarStyles.header}>
                        <TouchableOpacity onPress={prevMonth}>
                            <Text style={calendarStyles.navButton}>←</Text>
                        </TouchableOpacity>

                        <Text style={calendarStyles.headerTitle}>
                            {getBengaliMonthName(currentMonth.getMonth())} {toBengaliNumeral(currentMonth.getFullYear())}
                        </Text>

                        <TouchableOpacity onPress={nextMonth}>
                            <Text style={calendarStyles.navButton}>→</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Day name headers */}
                    <View style={calendarStyles.weekdayHeader}>
                        {dayNames.map((day, index) => (
                            <Text key={index} style={calendarStyles.weekdayText}>{day}</Text>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={calendarStyles.daysGrid}>
                        {generateCalendarDays().map((week, weekIndex) => (
                            <View key={weekIndex} style={calendarStyles.weekRow}>
                                {week.map((date, dayIndex) => (
                                    <TouchableOpacity
                                        key={dayIndex}
                                        style={[
                                            calendarStyles.dayCell,
                                            date && isSameDate(date, selectedDate) && calendarStyles.selectedDay
                                        ]}
                                        onPress={() => date && handleDateSelect(date)}
                                        disabled={!date}
                                    >
                                        <Text
                                            style={[
                                                calendarStyles.dayText,
                                                date && isSameDate(date, selectedDate) && calendarStyles.selectedDayText
                                            ]}
                                        >
                                            {date && date instanceof Date ? toBengaliNumeral(date.getDate()) : ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </View>

                    {/* Buttons */}
                    <View style={calendarStyles.buttonContainer}>
                        <TouchableOpacity
                            style={calendarStyles.button}
                            onPress={() => {
                                onSelectDate(formatDateToBengali(selectedDate));
                                onClose();
                            }}
                        >
                            <Text style={calendarStyles.buttonText}>নিশ্চিত করুন</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[calendarStyles.button, calendarStyles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={calendarStyles.buttonText}>বাতিল</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const calendarStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: mS(16),
        width: '90%',
        maxWidth: rS(380),
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: mS(15),
        width: '100%',
    },
    headerTitle: {
        fontSize: mS(18),
        fontWeight: 'bold',
    },
    navButton: {
        fontSize: mS(24),
        fontWeight: 'bold',
        padding: 5,
    },
    weekdayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: mS(10),
        width: '100%',
    },
    weekdayText: {
        width: '14%', // Exactly 1/7 of the row width
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: mS(14),
    },
    daysGrid: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: mS(2),
    },
    dayCell: {
        width: '14%', // Exactly 1/7 of the row width
        aspectRatio: 1, // Keep cells square
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        textAlign: 'center',
        fontSize: mS(14),
    },
    selectedDay: {
        backgroundColor: '#4a90e2',
        borderRadius: mS(18),
    },
    selectedDayText: {
        color: 'white',
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: mS(15),
    },
    button: {
        backgroundColor: '#4a90e2',
        padding: mS(10),
        borderRadius: 5,
        flex: 1,
        marginHorizontal: mS(5),
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#e24a4a',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default Calendar;