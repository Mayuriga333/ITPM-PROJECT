import React from "react";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_DAY = { available: false, from: "09:00", to: "17:00" };

const AvailabilityEditor = ({ availability, onChange }) => {
  const safeAvailability = availability || {};

  const getDay = (key) => ({
    ...DEFAULT_DAY,
    ...safeAvailability[key],
  });

  const handleToggle = (dayKey) => {
    const current = getDay(dayKey);
    onChange({
      ...safeAvailability,
      [dayKey]: {
        ...current,
        available: !current.available,
        from: current.from || "09:00",
        to: current.to || "17:00",
      },
    });
  };

  const handleTimeChange = (dayKey, field, value) => {
    const current = getDay(dayKey);
    onChange({
      ...safeAvailability,
      [dayKey]: {
        ...current,
        [field]: value,
      },
    });
  };

  return (
    <div className="availability-editor">
      {DAYS.map(({ key, label }) => {
        const day = getDay(key);
        return (
          <div
            key={key}
            className={`availability-day-row ${day.available ? "available" : "unavailable"}`}
          >
            <label className="availability-toggle">
              <input
                type="checkbox"
                checked={day.available}
                onChange={() => handleToggle(key)}
              />
              <span className="toggle-slider" />
            </label>
            <span className="availability-day-label">{label}</span>
            {day.available ? (
              <div className="availability-time-inputs">
                <input
                  type="time"
                  className="form-input time-input"
                  value={day.from || "09:00"}
                  onChange={(e) => handleTimeChange(key, "from", e.target.value)}
                />
                <span className="time-separator">to</span>
                <input
                  type="time"
                  className="form-input time-input"
                  value={day.to || "17:00"}
                  onChange={(e) => handleTimeChange(key, "to", e.target.value)}
                />
              </div>
            ) : (
              <span className="availability-unavailable-text">Unavailable</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AvailabilityEditor;
