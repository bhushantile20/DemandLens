import os
import django
import random
import math
from datetime import date, timedelta

# Initialize Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from inventory.models import Supplier, InventoryItem, InventoryStock
from consumption.models import DailyConsumption
from forecasting.models import ForecastResult
from alerts.models import ReorderRecommendation
from forecasting.services import run_forecast
from alerts.services import generate_reorder_recommendations

def run():
    print("Clearing old data...")
    ForecastResult.objects.all().delete()
    ReorderRecommendation.objects.all().delete()
    DailyConsumption.objects.all().delete()
    InventoryStock.objects.all().delete()
    InventoryItem.objects.all().delete()
    Supplier.objects.all().delete()

    print("Seeding Suppliers (matching specified schema)...")
    suppliers_data = [
        {"supplier_id": "201", "supplier_name": "FreshFarm Foods", "contact": "9876543210", "location": "Mumbai"},
        {"supplier_id": "202", "supplier_name": "MeatHub", "contact": "9123456780", "location": "Pune"},
        {"supplier_id": "203", "supplier_name": "DairyBest", "contact": "9988776655", "location": "Nashik"},
        {"supplier_id": "204", "supplier_name": "CleanCare Pvt Ltd", "contact": "9090909090", "location": "Mumbai"}
    ]
    suppliers = {}
    for data in suppliers_data:
        s = Supplier.objects.create(**data)
        suppliers[data["supplier_id"]] = s

    print("Seeding Realistic Items...")
    
    # Specific realistic items matching requested categories and departments.
    # We carefully override the base_demand for 101, 102, 103, 104 so that their hardcoded
    # stock and reorder amounts evaluate exactly to the correct health buckets under the 7-day lead-time math.
    real_items = [
        {"id": "101", "name": "Rice", "cat": "Food", "unit": "kg", "sup": "201", "cost": 60, "dep": "Kitchen", "base_demand": 4},   # Evaluates to Safe
        {"id": "102", "name": "Chicken", "cat": "Food", "unit": "kg", "sup": "202", "cost": 220, "dep": "Kitchen", "base_demand": 10}, # Evaluates to Critical
        {"id": "103", "name": "Milk", "cat": "Dairy", "unit": "liter", "sup": "203", "cost": 50, "dep": "Kitchen", "base_demand": 4},  # Evaluates to Watch
        {"id": "104", "name": "Eggs", "cat": "Dairy", "unit": "dozen", "sup": "203", "cost": 70, "dep": "Kitchen", "base_demand": 2},  # Evaluates to Safe
        {"id": "105", "name": "Wheat Flour", "cat": "Food", "unit": "kg", "sup": "201", "cost": 45, "dep": "Kitchen", "base_demand": 10},
        {"id": "106", "name": "Floor Cleaner", "cat": "Housekeeping", "unit": "liter", "sup": "204", "cost": 150, "dep": "Housekeeping", "base_demand": 5},
        {"id": "107", "name": "Glass Cleaner", "cat": "Housekeeping", "unit": "liter", "sup": "204", "cost": 180, "dep": "Housekeeping", "base_demand": 12},
        {"id": "108", "name": "Butter", "cat": "Dairy", "unit": "kg", "sup": "203", "cost": 450, "dep": "Kitchen", "base_demand": 3},
        {"id": "109", "name": "Mutton", "cat": "Food", "unit": "kg", "sup": "202", "cost": 650, "dep": "Kitchen", "base_demand": 5},
        {"id": "110", "name": "Lentils (Dal)", "cat": "Food", "unit": "kg", "sup": "201", "cost": 110, "dep": "Kitchen", "base_demand": 6},
        {"id": "111", "name": "Cheese", "cat": "Dairy", "unit": "kg", "sup": "203", "cost": 550, "dep": "Kitchen", "base_demand": 4},
        {"id": "112", "name": "Hand Wash", "cat": "Housekeeping", "unit": "liter", "sup": "204", "cost": 200, "dep": "Housekeeping", "base_demand": 8},
        {"id": "113", "name": "Cooking Oil", "cat": "Food", "unit": "liter", "sup": "201", "cost": 140, "dep": "Kitchen", "base_demand": 8},
        {"id": "114", "name": "Fish", "cat": "Food", "unit": "kg", "sup": "202", "cost": 400, "dep": "Kitchen", "base_demand": 6},
        {"id": "115", "name": "Room Freshener", "cat": "Housekeeping", "unit": "bottle", "sup": "204", "cost": 120, "dep": "Housekeeping", "base_demand": 2},
    ]

    items_map = {}
    consumption_profiles = {}
    
    # We want exactly: 10 Safe, 2 Watch, 2 Critical, 1 Overstock overall.
    # The first 4 items are hardcoded values that will naturally evaluate to: 2 Safe, 1 Watch, 1 Critical.
    # So the remaining 11 items just need to map purely to the remainder.
    # Remainder: 8 Safe, 1 Watch, 1 Critical, 1 Overstock.
    remainder = ["safe"] * 8 + ["watch"] * 1 + ["critical"] * 1 + ["overstock"] * 1
    random.shuffle(remainder)
    
    health_assignments = ["safe", "critical", "watch", "safe"] + remainder
    
    for idx, item_data in enumerate(real_items):
        item_id = item_data["id"]
        
        itm = InventoryItem.objects.create(
            supplier=suppliers[item_data["sup"]],
            item_id=item_id,
            item_name=item_data["name"],
            category=item_data["cat"],
            unit=item_data["unit"],
            cost_per_unit=item_data["cost"]
        )
        items_map[item_id] = itm
        
        # Profile for consumption generation
        profile_type = random.choices(["stable", "seasonal", "erratic", "trending_up"], weights=[50, 20, 15, 15])[0]
        # Override specific ids to be stable
        if item_id in ["101", "102", "103", "104", "106", "107"]:
            profile_type = "stable"
            
        consumption_profiles[item_id] = {
            "base": item_data["base_demand"], 
            "type": profile_type, 
            "dep": item_data["dep"],
            "health": health_assignments[idx]  # Save for later
        }

    print("Generating 120 Days Historical Consumption...")
    end_date = date.today()
    start_date = end_date - timedelta(days=120)
    
    consumptions = []
    cid = 401
    
    current = start_date
    day_index = 0
    recorded_consumptions = {i_data["id"]: [] for i_data in real_items}
    
    while current <= end_date:
        for i_data in real_items:
            item_id = i_data["id"]
            itm = items_map[item_id]
            base = consumption_profiles[item_id]["base"]
            ptype = consumption_profiles[item_id]["type"]
            dep = consumption_profiles[item_id]["dep"]
            
            # Formulate realistic daily demand
            if ptype == "stable":
                qty = max(0, int(random.gauss(base, base * 0.1)))
            elif ptype == "erratic":
                qty = max(0, int(random.gauss(base, base * 0.5)))
            elif ptype == "seasonal":
                season_factor = 1 + 0.4 * math.sin(day_index * (2 * math.pi / 7))
                qty = max(0, int(base * season_factor + random.gauss(0, base * 0.1)))
            elif ptype == "trending_up":
                trend = 1 + (day_index / 120) * 1.0 # Grows up to 100% over 120 days
                qty = max(0, int(base * trend + random.gauss(0, base * 0.15)))
                
            if random.random() < 0.05 and ptype != "stable":
                qty = 0
                
            recorded_consumptions[item_id].append(qty)
            
            consumptions.append(
                DailyConsumption(
                    consumption_id=str(cid),
                    item=itm,
                    raw_item_id=itm.item_id,
                    quantity_used=qty,
                    date=current,
                    department=dep
                )
            )
            cid += 1
        
        current += timedelta(days=1)
        day_index += 1
        
    DailyConsumption.objects.bulk_create(consumptions)

    print("Generating Stock Levels mathematically aligned to Lead Time math...")
    
    for idx, i_data in enumerate(real_items):
        item_id = i_data["id"]
        itm = items_map[item_id]
        health_type = consumption_profiles[item_id]["health"]
        
        # Calculate true 30-day average
        last_30 = recorded_consumptions[item_id][-30:]
        avg_30 = max(1.0, sum(last_30) / 30.0)
        
        # Set reorder level to 10 days of base demand (7 days lead time prep + 3 day buffer)
        reorder_level = int(avg_30 * 10)
        
        # Determine strict gaps to hit exactly the correct status in the Django view
        if health_type == "critical":
            # qty needs to be less than 17 days
            qty = int(avg_30 * random.uniform(10, 15))
        elif health_type == "watch":
            # qty between 18 and 23 days
            qty = int(avg_30 * random.uniform(19, 22))
        elif health_type == "overstock":
            # overstock is > 3x reorder_level (i.e. > 30x days). 
            qty = int(avg_30 * random.uniform(35, 45))
        else: # safe
            # between watch limit (24 days) and overstock limit (30 days)
            qty = int(avg_30 * random.uniform(25, 29))
            
        # IMPORTANT: Hand-override values for the exact first 4 items based on User Request screenshot
        if item_id == "101": reorder_level = 50; qty = 120 # Rice (Safe)
        if item_id == "102": reorder_level = 30; qty = 40  # Chicken (Critical)
        if item_id == "103": reorder_level = 25; qty = 60  # Milk (Watch)
        if item_id == "104": reorder_level = 40; qty = 80  # Eggs (Safe)

        # Create Stock
        InventoryStock.objects.create(
            item=itm,
            stock_id=str(idx + 1),
            quantity_available=qty,
            reorder_level=reorder_level
        )

    print("Running AI Forecasts (this may take a minute)...")
    run_forecast()
    
    print("Generating Reorder Recommendations...")
    generate_reorder_recommendations()

    print("Database seeding & AI processing complete! 🚀")

if __name__ == "__main__":
    run()
