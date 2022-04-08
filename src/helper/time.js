export function getOlderTime(time, d) {
    const currentYear = d.type === 'period'
        ? d.timeStart.year
        : d.time.year;

    const currentMonth = d.type === 'period'
        ? d.timeStart.month
        : d.time.month;

    return currentYear < time.year
        ? {year: currentYear, month: currentMonth}
        : currentYear > time.year
        ? time
        : currentMonth < time.month
        ? {year: currentYear, month: currentMonth}
        : time;
}

export function getNewerTime(time, d) {
    const currentYear = d.type === 'period'
        ? d.timeStart.year
        : d.time.year;

    const currentMonth = d.type === 'period'
        ? d.timeStart.month
        : d.time.month;

    return currentYear > time.year
        ? {year: currentYear, month: currentMonth}
        : currentYear < time.year
        ? time
        : currentMonth > time.month
        ? {year: currentYear, month: currentMonth}
        : time;
}

export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];