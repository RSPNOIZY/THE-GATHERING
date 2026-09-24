from dataclasses import dataclass
import random

@dataclass
class Panel:
    area_cm2: float = 40.0          # headband-ish
    eff: float = 0.15               # flexible CIGS/OPV range
    irradiance_mw_cm2: float = 80.0 # sun: ~100, cloudy: 5-30, indoor: 0.05-0.5
    temp_c: float = 25.0

@dataclass
class Battery:
    capacity_mah: float = 2000.0
    soc_mah: float = 1200.0
    v_nom: float = 3.7

@dataclass
class Load:
    draw_mah_per_hr: float = 180.0  # headphones-ish average

def mw_to_mah(mw: float, v: float) -> float:
    return mw / v

def simulate(hours=8, scenario="mixed"):
    panel = Panel()
    batt = Battery()
    load = Load()
    log = []
    
    for h in range(hours):
        if scenario == "outdoor":
            panel.irradiance_mw_cm2 = random.uniform(50, 100)
        elif scenario == "indoor":
            panel.irradiance_mw_cm2 = random.uniform(0.05, 0.5)
        else:  # mixed
            panel.irradiance_mw_cm2 = random.uniform(0.1, 0.5) if h < 4 else random.uniform(30, 90)
        
        total_mw = panel.irradiance_mw_cm2 * panel.area_cm2 * panel.eff
        conversion_eff = 0.85
        harvest_mah = mw_to_mah(total_mw * conversion_eff, batt.v_nom)
        consume_mah = load.draw_mah_per_hr
        net = harvest_mah - consume_mah
        batt.soc_mah = max(0.0, min(batt.capacity_mah, batt.soc_mah + net))
        
        log.append({
            "hour": h,
            "irradiance": round(panel.irradiance_mw_cm2, 2),
            "harvest_mah": round(harvest_mah, 1),
            "consume_mah": round(consume_mah, 1),
            "net_mah": round(net, 1),
            "soc_pct": round(100.0 * batt.soc_mah / batt.capacity_mah, 1),
        })
    return log

if __name__ == "__main__":
    print("\n🔋 AEON POWER SIMULATION - 10 HOUR DAY")
    print("=" * 70)
    print("\n📊 MIXED SCENARIO (4hr indoor → 6hr outdoor):\n")
    for row in simulate(hours=10, scenario="mixed"):
        bar = "█" * int(row["soc_pct"] / 5)
        status = "🟢" if row["soc_pct"] > 50 else "🟡" if row["soc_pct"] > 20 else "🔴"
        print(f"Hour {row['hour']:2d} | {status} {row['soc_pct']:5.1f}% |{bar:20s}| Net: {row['net_mah']:+6.1f} mAh | Harvest: {row['harvest_mah']:6.1f}")
    
    print("\n" + "=" * 70)
    print("\n☀️ OUTDOOR SCENARIO (full sun):\n")
    for row in simulate(hours=10, scenario="outdoor"):
        bar = "█" * int(row["soc_pct"] / 5)
        status = "🟢" if row["soc_pct"] > 50 else "🟡" if row["soc_pct"] > 20 else "🔴"
        print(f"Hour {row['hour']:2d} | {status} {row['soc_pct']:5.1f}% |{bar:20s}| Net: {row['net_mah']:+6.1f} mAh | Harvest: {row['harvest_mah']:6.1f}")
    
    print("\n" + "=" * 70)
    print("\n🏠 INDOOR SCENARIO (office lighting):\n")
    for row in simulate(hours=10, scenario="indoor"):
        bar = "█" * int(row["soc_pct"] / 5)
        status = "🟢" if row["soc_pct"] > 50 else "🟡" if row["soc_pct"] > 20 else "🔴"
        print(f"Hour {row['hour']:2d} | {status} {row['soc_pct']:5.1f}% |{bar:20s}| Net: {row['net_mah']:+6.1f} mAh | Harvest: {row['harvest_mah']:6.1f}")
