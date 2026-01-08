# Stats Display Behavior - Self-Assessed Efficiency

## What Shows When There's No Data?

### Self-Assessed Efficiency Stat (7th Item)

The "Self-Assessed Efficiency" stat shows different values based on your data:

| Situation | Display | Meaning |
|-----------|---------|---------|
| **No sessions at all** | `N/A` | No productivity data exists |
| **Sessions exist, but none rated** | `N/A` | You haven't rated any sessions yet |
| **Some sessions rated** | `75%` | Average of all your ratings |
| **All sessions rated** | `83%` | Average of all your ratings |

### Example Scenarios

#### Scenario 1: Fresh Install (No Data)
```
Daily Statistics
├─ Total Sessions: 0
├─ Total Focus Time: 0h 0m
├─ Average Focus Time: 0h 0m
├─ Total Procrastination: 0 alerts
├─ Total Pause Time: 0 pauses (0h 0m)
├─ Focus Efficiency: 0%
└─ Self-Assessed Efficiency: N/A  ← No data
```

#### Scenario 2: Old Sessions (No Ratings)
If you have sessions from before v1.2:
```
Daily Statistics
├─ Total Sessions: 5
├─ Total Focus Time: 2h 30m
├─ Average Focus Time: 30m
├─ Total Procrastination: 3 alerts
├─ Total Pause Time: 2 pauses (15m)
├─ Focus Efficiency: 87%
└─ Self-Assessed Efficiency: N/A  ← Old data has no ratings
```

#### Scenario 3: Mix of Old and New
If you have 5 old sessions (no ratings) + 2 new sessions (with ratings 80% and 90%):
```
Daily Statistics
├─ Total Sessions: 7
├─ Total Focus Time: 3h 45m
├─ Average Focus Time: 32m
├─ Total Procrastination: 4 alerts
├─ Total Pause Time: 3 pauses (20m)
├─ Focus Efficiency: 85%
└─ Self-Assessed Efficiency: 85%  ← Average of only the 2 rated sessions
```

#### Scenario 4: All New Sessions (All Rated)
```
Daily Statistics
├─ Total Sessions: 3
├─ Total Focus Time: 1h 30m
├─ Average Focus Time: 30m
├─ Total Procrastination: 1 alert
├─ Total Pause Time: 1 pause (5m)
├─ Focus Efficiency: 92%
└─ Self-Assessed Efficiency: 78%  ← Average: (75 + 80 + 80) / 3 = 78%
```

## Why "N/A" Instead of "0%"?

**Problem with "0%":**
- Confusing: Does it mean no data, or did you rate yourself 0%?
- Misleading: Looks like you performed poorly

**Solution with "N/A":**
- ✅ Clear: Means "Not Available" or "No data yet"
- ✅ Honest: Doesn't imply poor performance
- ✅ Prompts action: Encourages you to start rating sessions

## How the Calculation Works

```javascript
// Pseudo-code
if (no sessions exist) {
  return "N/A"
} else {
  ratedSessions = sessions that have efficiencyRating field

  if (ratedSessions.length === 0) {
    return "N/A"  // No ratings yet
  } else {
    average = sum of all ratings / count of rated sessions
    return average + "%"  // e.g., "75%"
  }
}
```

## Example Data Files

### Session WITHOUT Rating (old data)
```json
{
  "timestamp": "2026-01-01T10:00:00.000Z",
  "focusTime": 1800000,
  "procrastinationCount": 0,
  "pauseCount": 1,
  "pauseTime": 60000
  // No efficiencyRating field
}
```
This session is counted in "Total Sessions" but NOT in "Self-Assessed Efficiency"

### Session WITH Rating (new data)
```json
{
  "timestamp": "2026-01-07T14:00:00.000Z",
  "focusTime": 2400000,
  "procrastinationCount": 1,
  "pauseCount": 0,
  "pauseTime": 0,
  "efficiencyRating": 85  ← This is included
}
```
This session is counted in both "Total Sessions" AND "Self-Assessed Efficiency"

## Visual Examples

### Before Rating Any Sessions
```
╔════════════════════════════════╗
║   Daily Statistics (Today)     ║
╠════════════════════════════════╣
║ 📅 Total Sessions              ║
║    3                           ║
╠════════════════════════════════╣
║ ⏰ Total Focus Time            ║
║    1h 45m                      ║
╠════════════════════════════════╣
║ ... (other stats) ...          ║
╠════════════════════════════════╣
║ ⭐ Self-Assessed Efficiency    ║
║    N/A                         ║  ← Shows N/A
╚════════════════════════════════╝
```

### After Rating 2 Sessions
```
╔════════════════════════════════╗
║   Daily Statistics (Today)     ║
╠════════════════════════════════╣
║ 📅 Total Sessions              ║
║    3                           ║
╠════════════════════════════════╣
║ ⏰ Total Focus Time            ║
║    1h 45m                      ║
╠════════════════════════════════╣
║ ... (other stats) ...          ║
╠════════════════════════════════╣
║ ⭐ Self-Assessed Efficiency    ║
║    83%                         ║  ← Shows average
╚════════════════════════════════╝
    (80% + 85%) / 2 = 82.5% → 83%
```

## Summary

- **"N/A"** = No efficiency rating data available (either no sessions, or no rated sessions)
- **"XX%"** = Average of all your self-assessed efficiency ratings
- Only sessions with `efficiencyRating` field are counted
- Old sessions (before v1.2) don't have this field, so they show as N/A

This makes it clear when you haven't rated sessions yet vs. when you have actual rating data to display!
