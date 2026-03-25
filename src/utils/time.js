const WORK_DAY_START_HOUR = 8;
const WORK_DAY_END_HOUR = 19;

/**
 * Parses a time string "HH:MM" into total minutes from midnight.
 * @param {string} timeStr - The time string to parse.
 * @returns {number} - Total minutes from midnight.
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
    return WORK_DAY_START_HOUR * 60; // Default to start of the day
  }
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) {
    return WORK_DAY_START_HOUR * 60;
  }
  return h * 60 + m;
};

/**
 * Formats total minutes from midnight into a "HH:MM" time string.
 * @param {number} totalMinutes - Total minutes from midnight.
 * @returns {string} - The formatted time string.
 */
export const formatMinutesToTime = (totalMinutes) => {
  if (isNaN(totalMinutes)) {
    return `${String(WORK_DAY_START_HOUR).padStart(2, '0')}:00`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Calculates the end time and day for a job, considering work day hours.
 * @param {number} startDay - The start day of the job.
 * @param {string} startTime - The start time of the job ("HH:MM").
 * @param {number} durationHours - The duration of the job in hours.
 * @returns {{endDay: number, endTime: string}}
 */
export const calculateEndTime = (startDay, startTime, durationHours) => {
    let currentMinutes = parseTimeToMinutes(startTime);
    let currentDay = startDay;
    let remainingDurationMinutes = durationHours * 60;

    const endOfWorkDayMinutes = WORK_DAY_END_HOUR * 60;
    const startOfWorkDayMinutes = WORK_DAY_START_HOUR * 60;

    // If starting after end of day, push to next day
    if (currentMinutes >= endOfWorkDayMinutes) {
        currentDay += 1;
        currentMinutes = startOfWorkDayMinutes;
    }

    while (remainingDurationMinutes > 0) {
        const remainingMinutesInDay = endOfWorkDayMinutes - currentMinutes;

        if (remainingDurationMinutes <= remainingMinutesInDay) {
            currentMinutes += remainingDurationMinutes;
            remainingDurationMinutes = 0;
        } else {
            remainingDurationMinutes -= remainingMinutesInDay;
            currentDay += 1;
            currentMinutes = startOfWorkDayMinutes;
        }
    }

    return {
        endDay: currentDay,
        endTime: formatMinutesToTime(currentMinutes),
    };
};