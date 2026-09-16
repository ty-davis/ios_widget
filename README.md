# Baby Health Scriptable Widget

This project gives you a small, private baby-health logger that runs entirely inside the Scriptable app on an iPhone.

It records:

- Breastfeeding sessions: side, duration, start time, and notes
- Bottle feeds: amount, unit, time, and notes
- Medications: name, dose, unit, time, and notes

It includes a Home Screen widget, a quick-entry menu, and an app-like history dashboard.

## What You Are Installing

There are three Scriptable scripts:

### `Baby Health Widget`

This is the Home Screen widget. It shows:

- How long ago the latest breast or bottle feed happened
- The details of that feed
- The most recent medication

When you tap the widget, it opens the dashboard.

### `Baby Health Entry`

This is the data-entry script. Run it inside Scriptable when you want to:

- Log breastfeeding
- Log bottle feeding
- Log medication
- Review today's records
- Delete one of the ten most recent records

### `Baby Health Dashboard`

This is the detailed, app-like view. It opens inside Scriptable and includes:

- Today, 7-day, 30-day, and all-time views
- Summary cards for each event type
- Daily activity charts
- Breastfeeding averages and side breakdown
- Bottle averages and totals
- Medication history grouped by medication
- A filterable event history

The dashboard works offline. It does not load charts or data from the internet.

## Before You Start

You need:

- An iPhone
- The free Scriptable app installed from the App Store
- The three `.js` files from this project

You do not need:

- A Google account
- A server
- A database account
- Programming experience
- An internet connection after the scripts have been copied to your phone

## Install Scriptable

1. On your iPhone, open the App Store.
2. Search for `Scriptable`.
3. Install the app published by Scriptable.
4. Open Scriptable once so iOS completes the initial setup.

## Copy the Scripts to Your iPhone

The simplest method is copy and paste. You can do this from a computer, or from any text editor that lets you open these files.

### Copy the widget script

1. Open `Baby Health Widget.js` on your computer.
2. Select all of the text.
3. Copy it.
4. Open Scriptable on your iPhone.
5. Tap the `+` button to create a new script.
6. Name the script exactly:

   ```text
   Baby Health Widget
   ```

7. Delete any starter text in the editor.
8. Paste the copied code.
9. Tap the back arrow or Scriptable's save/back control to return to the script list.

### Copy the entry script

1. Open `Baby Health Entry.js` on your computer.
2. Select all of the text and copy it.
3. In Scriptable, create another new script.
4. Name it exactly:

   ```text
   Baby Health Entry
   ```

5. Paste the code and return to the script list.

### Copy the dashboard script

1. Open `Baby Health Dashboard.js` on your computer.
2. Select all of the text and copy it.
3. In Scriptable, create one more new script.
4. Name it exactly:

   ```text
   Baby Health Dashboard
   ```

5. Paste the code and return to the script list.

The names must match exactly. The widget uses the script name to know what to open when tapped.

## Create Your First Record

1. Open `Baby Health Entry` in Scriptable.
2. Tap the play button if Scriptable does not run it automatically.
3. Choose `Log breastfeeding`.
4. Choose `Left`, `Right`, or `Both`.
5. Enter the duration in minutes.
6. Enter `now`, or enter a time such as:

   ```text
   2026-09-16 14:30
   ```

7. Add a note, or leave it blank.
8. Tap `Save` on each prompt.

The first saved record creates the local data file automatically.

## Add Bottle or Medication Records

Run `Baby Health Entry` again whenever you want to log something.

### Bottle feeding

1. Choose `Log bottle feeding`.
2. Enter the amount, such as `120`.
3. Enter the unit, such as `mL` or `oz`.
4. Enter the time, or leave it as `now`.
5. Add an optional note.

For the cleanest totals, use the same bottle unit consistently. For example, use `mL` for every bottle. The dashboard does not silently convert between `mL` and `oz`.

### Medication

1. Choose `Log medication`.
2. Enter the medication name.
3. Enter the dose.
4. Enter the unit.
5. Enter when it was taken.
6. Add an optional note.

Medication details are recorded and displayed exactly as entered. The scripts do not calculate doses, decide whether a dose is due, or provide medical advice.

## Add the Widget to Your Home Screen

1. Go to the iPhone Home Screen.
2. Touch and hold an empty area until the apps start to jiggle.
3. Tap the `+` button in the top-left corner.
4. Search for `Scriptable`.
5. Choose a medium Scriptable widget. The current layout is designed for medium size.
6. Tap `Add Widget`.
7. Touch and hold the new widget.
8. Tap `Edit Widget`.
9. Set `Script` to `Baby Health Widget`.
10. Close the edit screen.

The widget should now show the latest feed. iOS controls exactly when widgets refresh, so a newly saved record may not appear immediately. Opening the widget or waiting for the next refresh will update it.

## Open the Dashboard

Tap the widget. It should open `Baby Health Dashboard` inside Scriptable.

The dashboard starts on `Today`. At the top, choose:

- `Today` for records from the current calendar day
- `7 days` for the current day and six previous days
- `30 days` for the current day and 29 previous days
- `All time` for every record in the local data file

The `History` section can be filtered by:

- All events
- Breastfeeding
- Bottle
- Medication

The `Log event` button in the dashboard opens the entry script. If that button does not work, use `Baby Health Entry` directly from the Scriptable script list.

## Where the Data Is Stored

The scripts use Scriptable's local file storage through `FileManager.local()`.

The shared file is named:

```text
BabyHealthData.json
```

It belongs to Scriptable's local Documents directory on that iPhone. The scripts do not send it to Google, a web server, or an external database.

This also means the data does not automatically sync to another iPhone or iPad.

## Updating a Script

If a later version of one of the scripts is provided:

1. Open the existing script in Scriptable.
2. Select all of its code.
3. Paste the complete new version.
4. Save by returning to the script list.

Do not create a second script with a slightly different name unless you also update the widget URL. The widget expects the exact script names listed above.

Updating a script does not intentionally delete `BabyHealthData.json`. Still, avoid deleting the data file unless you want to erase the records.

## Troubleshooting

### Tapping the widget does not open the dashboard

Check that the dashboard script is named exactly:

```text
Baby Health Dashboard
```

The URL in the widget script uses that exact name.

### The widget is blank

Open `Baby Health Widget` directly in Scriptable and run it once. Then check that the widget is configured to use `Baby Health Widget` rather than another Scriptable script.

### The dashboard has no records

Make sure the entry script and dashboard script are both using the same Scriptable app. Create one test record through `Baby Health Entry`, then reopen the dashboard.

### New records do not appear immediately

This is normal for iOS widgets. iOS decides when a widget refreshes. Running the widget script manually from Scriptable can help confirm that the data is present.

### The dashboard link to `Log event` does not work

Open `Baby Health Entry` directly from Scriptable. The dashboard still works as a history view even if the link behavior is restricted by the Scriptable version or iOS.

## Health and Privacy Note

This project is a personal record-keeping tool, not a medical device or medical advice system. Verify medication names, doses, and schedules with your pediatrician or pharmacist. Keep the iPhone protected with its normal passcode and consider the privacy implications of storing health information on the device.
