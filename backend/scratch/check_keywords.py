from app.core.keywords import KEYWORD_CATEGORIES
import json

counts = {}
for k, v in KEYWORD_CATEGORIES.items():
    counts[v] = counts.get(v, 0) + 1

print(json.dumps(counts, indent=4))
