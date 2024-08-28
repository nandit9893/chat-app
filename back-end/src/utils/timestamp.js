const convertTimeStamp = (timestamp) => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const formattedMinute = minute < 10 ? `0${minute}` : minute;
  if (hour > 12) {
    return hour - 12 + ":" + formattedMinute + " pm";
  } else {
    return hour + ":" + formattedMinute + " am";
  }
};

export default convertTimeStamp;
