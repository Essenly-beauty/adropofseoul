# -*- coding: utf-8 -*-
"""
[올리브영 글로벌 2단계] 확정된 대조표를 마스터에 적용.

입력 : reconcile_global.csv (matched_product_id 채워짐), oliveyoung_global_crawl.json
동작 :
  - matched_product_id = 기존 P#####  → 그 제품에 product_name_en 채우고(비었을 때만)
                                          product_sources에 '올리브영글로벌' 소스 추가
  - matched_product_id = NEW           → 다음 내부ID 부여, products에 추가
                                          (brand_ko 있으면 한글 브랜드, 없으면 영문 그대로 +
                                           brands.csv에 등록[국문 확인필요])
  - skin_types / concerns 신호도 크롤 결과에서 함께 반영
원칙: product_id 불변, 기존 product_name_en 덮어쓰기 금지, 저장 전 *.bak.csv 백업, 검증 실패 시 중단.
"""
import json, shutil
from pathlib import Path
import pandas as pd

DIR = Path(__file__).resolve().parent / "csv"; ENC = "utf-8-sig"

products = pd.read_csv(DIR/"products.csv", dtype=str).fillna("")
sources  = pd.read_csv(DIR/"product_sources.csv", dtype=str).fillna("")
brands   = pd.read_csv(DIR/"brands.csv", dtype=str).fillna("")
skin     = pd.read_csv(DIR/"skin_types.csv", dtype=str).fillna("")
concern  = pd.read_csv(DIR/"concerns.csv", dtype=str).fillna("")
rec      = pd.read_csv(DIR/"reconcile_global.csv", dtype=str).fillna("")
crawled  = {r["oy_id"]: r for r in json.load(open(DIR/"oliveyoung_global_crawl.json", encoding="utf-8"))}

if "product_name_en" not in products.columns:
    products.insert(list(products.columns).index("product_name")+1, "product_name_en", "")

en2ko = {e.strip().lower(): b for b, e in zip(brands.brand, brands.brand_en) if e.strip()}
pidx  = {p: i for i, p in enumerate(products.product_id)}
next_num = max([int(p[1:]) for p in products.product_id], default=0) + 1
existing_src = set(zip(sources.source, sources.source_product_id))

new_products, new_sources, new_skin, new_concern, new_brands = [], [], [], [], []

for _, r in rec.iterrows():
    m = r["matched_product_id"].strip()
    if not m:
        raise SystemExit(f"미확정 행 있음: oy_global_id={r['oy_global_id']} → matched_product_id를 채우세요")

    if m.upper() == "NEW":
        pid = f"P{next_num:05d}"; next_num += 1
        ko = en2ko.get(r["brand_en"].strip().lower(), "")
        brand = ko if ko else r["brand_en"]
        if not ko:                                   # 다리 없는 새 브랜드 → brands에 등록
            new_brands.append([r["brand_en"], r["brand_en"], "확인필요(국문)"])
            en2ko[r["brand_en"].strip().lower()] = r["brand_en"]
        new_products.append({"product_id":pid,"brand":brand,"product_name":"",
            "product_name_en":r["product_name_en"],"category":"","subcategory":"",
            "is_rising":"","rising_rank":"","category_rank":"","brand_rank":""})
    else:
        pid = m
        if pid not in pidx:
            raise SystemExit(f"존재하지 않는 product_id: {pid} (oy_global_id={r['oy_global_id']})")
        if not products.at[pidx[pid], "product_name_en"]:
            products.at[pidx[pid], "product_name_en"] = r["product_name_en"]

    # 소스 + 신호
    if ("올리브영글로벌", r["oy_global_id"]) not in existing_src:
        new_sources.append([pid, "올리브영글로벌", r["oy_global_id"], r["url"]])
        existing_src.add(("올리브영글로벌", r["oy_global_id"]))
    c = crawled.get(r["oy_global_id"], {})
    for s in c.get("skin_types", []): new_skin.append([pid, "올리브영글로벌", s, ""])
    for cc in c.get("concerns", []):  new_concern.append([pid, "올리브영글로벌", cc])

# 병합
products = pd.concat([products, pd.DataFrame(new_products)], ignore_index=True)
sources  = pd.concat([sources,  pd.DataFrame(new_sources, columns=sources.columns)], ignore_index=True)
skin     = pd.concat([skin,     pd.DataFrame(new_skin, columns=skin.columns)]).drop_duplicates()
concern  = pd.concat([concern,  pd.DataFrame(new_concern, columns=concern.columns)]).drop_duplicates()
if new_brands:
    brands = pd.concat([brands, pd.DataFrame(new_brands, columns=brands.columns)]).drop_duplicates("brand")

# 검증
assert products.product_id.is_unique, "product_id 중복!"
assert set(sources.product_id) <= set(products.product_id), "고아 소스 행"

# 원본값을 매핑표에 등록 (신규 source/raw만, std_value 공란)
def register_raw(map_name, source, values):
    cols = ["source","raw_value","std_value"]
    p = DIR/map_name
    m = pd.read_csv(p, dtype=str).fillna("") if p.exists() else pd.DataFrame(columns=cols)
    seen = set(zip(m["source"], m["raw_value"]))
    add = [[source, v, ""] for v in dict.fromkeys(values) if v and (source, v) not in seen]
    if add:
        m = pd.concat([m, pd.DataFrame(add, columns=cols)], ignore_index=True)
    return m
sk_map = register_raw("skin_type_map.csv", "올리브영글로벌", [x[2] for x in new_skin])
co_map = register_raw("concern_map.csv",   "올리브영글로벌", [x[2] for x in new_concern])

# 백업 후 저장
out = {"products.csv":products, "product_sources.csv":sources,
       "skin_types.csv":skin, "concerns.csv":concern, "brands.csv":brands,
       "skin_type_map.csv":sk_map, "concern_map.csv":co_map}
for name, df in out.items():
    if (DIR/name).exists():
        shutil.copy(DIR/name, DIR/name.replace(".csv", ".bak.csv"))
    df.to_csv(DIR/name, index=False, encoding=ENC)

matched = (rec["matched_product_id"].str.upper() != "NEW").sum()
newn    = (rec["matched_product_id"].str.upper() == "NEW").sum()
print(f"기존제품 매칭 {matched} · 신규 {newn} · 신규브랜드 {len(new_brands)}")
print(f"총 제품 {len(products)}")
