export function formatTime(time) {
  const [hourStr, minute] = time.split(':');
  const hour = Number(hourStr);
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}
