"""Generate placeholder narration for Basa Quest with free neural voices.

Run on a computer with internet (this does NOT run inside the app):

    cd basa-quest
    pip install edge-tts            # once
    npm run audio:generate          # makes every missing file in public/audio/

Options (after `--`):  npm run audio:generate -- --force   (remake all files)
                       npm run audio:generate -- --dry-run (list what would be made)

It uses Microsoft Edge's online "Read aloud" voices through the free `edge-tts` package:
Filipino (fil-PH) and Philippine English (en-PH). That service is unofficial and free;
treat the files as PLACEHOLDERS until a teacher has listened to them, and replace any line
with a real recording at the same file path whenever you like.
"""

import asyncio
import json
import os
import subprocess
import sys

try:
    import edge_tts
except ImportError:
    print("This needs the edge-tts package. Run:  pip install edge-tts")
    sys.exit(1)

# One voice per gender per language. Pitch and speed give each character a little personality.
VOICE = {
    ("fil", "f"): "fil-PH-BlessicaNeural",
    ("fil", "m"): "fil-PH-AngeloNeural",
    ("en", "f"): "en-PH-RosaNeural",
    ("en", "m"): "en-PH-JamesNeural",
}
# who -> (gender, pitch, rate). "" is the narrator.
CAST = {
    "": ("f", "+0Hz", "-12%"),
    "tala": ("f", "+12Hz", "-8%"),
    "nena": ("f", "-2Hz", "-10%"),
    "muning": ("f", "+20Hz", "-10%"),
    "nonoy": ("m", "+28Hz", "-6%"),
    "jun": ("m", "+4Hz", "-8%"),
    "lolo": ("m", "-8Hz", "-18%"),
}


def load_manifest():
    out = subprocess.run(
        ["node", "scripts/list-audio.mjs", "--json"], capture_output=True, text=True, check=True
    ).stdout
    return json.loads(out)


async def make(item):
    gender, pitch, rate = CAST.get(item["who"], CAST[""])
    voice = VOICE[(item["lang"], gender)]
    os.makedirs(os.path.dirname(item["path"]), exist_ok=True)
    tmp = item["path"] + ".part"
    try:
        await edge_tts.Communicate(item["text"], voice, rate=rate, pitch=pitch).save(tmp)
        os.replace(tmp, item["path"])
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


async def main():
    force = "--force" in sys.argv
    dry = "--dry-run" in sys.argv
    items = load_manifest()
    todo = [i for i in items if force or not os.path.exists(i["path"])]
    print(f"{len(items)} lines, {len(todo)} to make")
    failed = 0
    for n, item in enumerate(todo, 1):
        who = item["who"] or "narrator"
        if dry:
            print(f"[{n}/{len(todo)}] {item['path']}  ({who})  {item['text'][:60]}")
            continue
        try:
            await make(item)
            print(f"[{n}/{len(todo)}] {item['path']}")
        except Exception as e:  # keep going; the app falls back for missing files
            failed += 1
            print(f"[{n}/{len(todo)}] FAILED {item['path']}: {e}")
    if not dry:
        print(f"Done. {len(todo) - failed} made, {failed} failed. Commit public/audio and redeploy.")


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    asyncio.run(main())
