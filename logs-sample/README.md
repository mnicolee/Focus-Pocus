# Sample dataset

Randomised, fake session data for troubleshooting and demos.

Focus Pocus does **not** use this in normal operation. Your real sessions are stored
offline in `Documents/FocusPocus/`. This folder exists only as a reference dataset, for
example to:

- regenerate the portfolio dashboard when no real logs are present, or
- exercise the stats UI without touching real data.

Reshuffle it any time:

```
node dev-tools/make-sample-data.js
```
