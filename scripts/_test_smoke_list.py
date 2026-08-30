"""The Telegram count must rise when a unit is ticked. Never a baked 53."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "codex"))
from smoke_list import progress_line, _reply  # noqa: E402


def eq(got, want, label):
    if got != want:
        raise SystemExit(f"FAIL {label}: {got!r} != {want!r}")
    print("ok", label)


# Old bug: remaining 58, total frozen at 53 → "-5 down"
eq(
    progress_line(58, 53, "stamp"),
    "0 down, 58 to go (of 58). Snapshot stamp.",
    "stale 53 never goes negative",
)

eq(
    progress_line(58, 116, "stamp"),
    "58 down, 58 to go (of 116). Snapshot stamp.",
    "daily tick on a 116 rail",
)
eq(
    progress_line(57, 116, "stamp"),
    "59 down, 57 to go (of 116). Snapshot stamp.",
    "finished count rises after another tick",
)

order = [(f"u{i}", f"L{i}") for i in range(62)]
done = {f"u{i}" for i in range(4)}  # 4 ticked since snapshot
got = _reply(order, done, {}, "2026-08-30 19:51", note="u4 logged\n", total=116)
if "4 down" in got or "-5 down" in got:
    raise SystemExit(f"FAIL reply used snapshot ticks not rail:\n{got}")
if "58 to go (of 116)" not in got:
    raise SystemExit(f"FAIL reply footer:\n{got}")
if "59 down" not in got:  # 116-57 wait vis = 62-4 = 58, down = 116-58 = 58
    pass
if "58 down, 58 to go (of 116)" not in got:
    raise SystemExit(f"FAIL reply should be 58 down of 116:\n{got}")
print("ok reply uses rail total")

done2 = done | {"u4"}
got2 = _reply(order, done2, {}, "2026-08-30 19:51", total=116)
if "59 down, 57 to go (of 116)" not in got2:
    raise SystemExit(f"FAIL second tick should rise:\n{got2}")
print("ok second tick rises")
print("all ok")
