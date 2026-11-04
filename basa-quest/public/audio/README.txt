Basa Quest audio folder
=======================

Put recorded MP3 files here. The app finds them automatically. No code changes.
Until a file exists, the Listen (Makinig) button shows "Audio coming soon".

Text that differs by reading band:  {lang}/level-{n}/band-{a|b}/{id}.mp3
Text shared by both bands:          {lang}/level-{n}/{id}.mp3

  lang = fil or en
  n    = level number (1)
  id   = the line id in src/content/adventure.ts (for example "q1-note-3")

Examples:
  fil/level-1/band-a/intro-1.mp3
  en/level-1/band-b/q1-note-3.mp3
  fil/level-1/q1-wrong-soyBottle.mp3
  en/level-1/choice-share-why.mp3

Get the full list (with the exact text to read) by running, in the basa-quest folder:
  npm run audio:list > audio-list.tsv

Keep files small: mono, 64 kbps MP3 is plenty for speech.
