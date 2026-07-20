# -*- coding: utf-8 -*-
"""
[원본값 인벤토리] 크롤 결과에서 각 소스의 skin/concern 원본값 목록만 뽑아
매핑표(skin_type_map.csv, concern_map.csv)에 신규 항목을 추가한다(std_value는 공란).
병합 전에 "이 소스엔 어떤 값들이 있나"를 먼저 보고 매핑을 준비할 때 쓴다.

사용: python inventory_raw_values.py <crawl.json> <source명>
  예: python inventory_raw_values.py oliveyoung_global_crawl.json 올리브영글로벌
"""
import sys, json
from pathlib import Path
import pandas as pd

DIR = Path(__file__).resolve().parent / "csv"; ENC = "utf-8-sig"

def register(map_name, source, values):
    cols = ["source","raw_value","std_value"]
    p = DIR/map_name
    m = pd.read_csv(p, dtype=str).fillna("") if p.exists() else pd.DataFrame(columns=cols)
    seen = set(zip(m["source"], m["raw_value"]))
    uniq = list(dict.fromkeys(v for v in values if v))
    add = [[source, v, ""] for v in uniq if (source, v) not in seen]
    if add:
        m = pd.concat([m, pd.DataFrame(add, columns=cols)], ignore_index=True)
        m.to_csv(p, index=False, encoding=ENC)
    return uniq, len(add)

def main():
    if len(sys.argv) < 3:
        print("사용: python inventory_raw_values.py <crawl.json> <source명>"); return
    crawl_path, source = sys.argv[1], sys.argv[2]
    data = json.load(open(crawl_path, encoding="utf-8"))
    skins    = [s for r in data for s in r.get("skin_types", [])]
    concerns = [c for r in data for c in r.get("concerns", [])]
    su, sa = register("skin_type_map.csv", source, skins)
    cu, ca = register("concern_map.csv",   source, concerns)
    print(f"[{source}] 크롤 {len(data)}건")
    print(f"  skin 원본값 {len(su)}종 (신규 {sa} 매핑표 추가): {sorted(su)}")
    print(f"  concern 원본값 {len(cu)}종 (신규 {ca} 매핑표 추가): {sorted(cu)}")
    print("→ skin_type_map.csv / concern_map.csv 의 std_value 칸을 채워 표준화 규칙 완성")

if __name__ == "__main__":
    main()
