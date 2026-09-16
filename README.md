# Baby Health Scriptable Widget

Two self-contained Scriptable scripts for recording breastfeeding sessions and medication doses locally on an iPhone.

## Files

- `Baby Health Widget.js`: the Home Screen widget.
- `Baby Health Entry.js`: the script used to add, review, edit, and delete records.

The scripts share `BabyHealthData.json` in Scriptable's **local** documents directory. No network requests, Google services, or external accounts are used.

## Install

1. Open `Baby Health Widget.js` in a text editor and copy it into a new Scriptable script named `Baby Health Widget`.
2. Do the same for `Baby Health Entry.js`, naming it `Baby Health Entry`.
3. Run `Baby Health Entry` once from inside Scriptable. Choose `Log breastfeeding` to create the local data file.
4. Add a Scriptable widget to the Home Screen and select `Baby Health Widget`.
5. To record an event, open `Baby Health Entry` from Scriptable. The widget is a display; it is not intended to be the editing interface.

## First-version behavior

- Breastfeeding records contain start time, duration, side, and optional notes.
- Medication records contain name, time, dose, unit, and optional notes.
- The widget shows the latest feed, today's feed count and total time, and recent medications.
- The entry script supports review, editing, and deletion of today's records.
- Medication information is displayed exactly as entered. This project does not calculate doses or provide medical advice.

## Storage

The first version intentionally uses `FileManager.local()`. That keeps data on the device running Scriptable. It does not sync records between devices. The JSON file is created automatically at:

```text
Scriptable/Documents/BabyHealthData.json
```

## Questions for the next iteration

- What name or label should appear in the widget instead of `Baby`?
- Should medication names be selected from a predefined list?
- Should the widget include bottle feeds, pumping, diapers, temperature, or sleep later?
- Do you want a more compact night-time design or a more detailed dashboard?
