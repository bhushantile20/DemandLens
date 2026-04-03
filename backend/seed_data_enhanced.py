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

def run():
    print("Clearing old data...")
    DailyConsumption.objects.all().delete()
    InventoryStock.objects.all().delete()
    InventoryItem.objects.all().delete()
    Supplier.objects.all().delete()

    print("Seeding Suppliers...")
    suppliers_data = [
        {"supplier_id": "SUP001", "supplier_name": "FreshFarm Foods", "contact": "9876543210", "location": "Mumbai"},
        {"supplier_id": "SUP002", "supplier_name": "MeatHub", "contact": "9123456780", "location": "Pune"},
        {"supplier_id": "SUP003", "supplier_name": "DairyBest", "contact": "9988776655", "location": "Nashik"},
        {"supplier_id": "SUP004", "supplier_name": "CleanCare Pvt Ltd", "contact": "9090909090", "location": "Mumbai"},
        {"supplier_id": "SUP005", "supplier_name": "BakerySource", "contact": "8877665544", "location": "Goa"}
    ]
    suppliers = {}
    for data in suppliers_data:
        s = Supplier.objects.create(**data)
        suppliers[data["supplier_id"]] = s

    print("Seeding More Diverse Items...")
    items_data = [
        # category, unit, supplier_id, cost, base_demand
        {"item_id": "ITM101", "item_name": "Premium Rice", "category": "Food", "unit": "kg", "sup": "SUP001", "cost": 60, "base": 20},
        {"item_id": "ITM102", "item_name": "Whole Chicken", "category": "Food", "unit": "kg", "sup": "SUP002", "cost": 220, "base": 15},
        {"item_id": "ITM103", "item_name": "Organic Milk", "category": "Dairy", "unit": "liter", "sup": "SUP003", "cost": 50, "base": 12},
        {"item_id": "ITM104", "item_name": "Large Eggs", "category": "Dairy", "unit": "dozen", "sup": "SUP003", "cost": 70, "base": 8},
        {"item_id": "ITM105", "item_name": "Fresh Bread", "category": "Bakery", "unit": "loaf", "sup": "SUP005", "cost": 40, "base": 25},
        {"item_id": "ITM106", "item_name": "Butter", "category": "Dairy", "unit": "pack", "sup": "SUP003", "cost": 150, "base": 5},
        {"item_id": "ITM107", "item_name": "Dish Soap", "category": "Housekeeping", "unit": "bottle", "sup": "SUP004", "cost": 90, "base": 3},
        {"item_id": "ITM108", "item_name": "Vegetable Oil", "category": "Food", "unit": "liter", "sup": "SUP001", "cost": 110, "base": 10},
    ]
    
    items_dict = {}
    for data in items_data:
        sup = suppliers[data.pop("sup")]
        base_demand = data.pop("base")
        i = InventoryItem.objects.create(
            item_id=data["item_id"],
            item_name=data["item_name"],
            category=data["category"],
            unit=data["unit"],
            supplier=sup,
            cost_per_unit=data["cost"]
        )
        items_dict[data["item_id"]] = (i, base_demand)

    print("Seeding Stock Levels...")
    for item_id, (item_obj, base) in items_dict.items():
        InventoryStock.objects.create(
            stock_id=f"STK_{item_id}",
            item=item_obj,
            quantity_available=base * 10,
            reorder_level=base * 4
        )

    print("Generating 2 Years of Patterned Consumption Data (730 Days)...")
    # This loop generates data with:
    # 1. Weekly seasonality (Higher demand on Sat/Sun)
    # 2. Monthly seasonality (Slightly higher at month end)
    # 3. Overall trend (Slight growth over 2 years)
    # 4. Random noise & Outpliers
    
    end_date = date.today()
    start_date = end_date - timedelta(days=730)
    
    consumptions_to_create = []
    counter = 1000
    departments = ["Kitchen", "Housekeeping", "Bakery", "Room Service"]
    
    current_date = start_date
    day_count = 0
    
    while current_date <= end_date:
        day_of_week = current_date.weekday() # 0-6 (Mon-Sun)
        is_weekend = 1.3 if day_of_week >= 5 else 1.0 # 30% jump on weekends
        
        # Monthly trend (sin wave)
        month_factor = 1 + 0.1 * math.sin(2 * math.pi * current_date.day / 30)
        
        # Yearly growth factor (gradual increase)
        growth_factor = 1 + (day_count / 730) * 0.2 # 20% growth over 2 years
        
        for item_id, (item_obj, base_demand) in items_dict.items():
            # Base logic
            daily_base = base_demand * is_weekend * month_factor * growth_factor
            
            # Add random noise (+/- 15%)
            noise = random.uniform(0.85, 1.15)
            qty = int(daily_base * noise)
            
            # Occasional Outlier (1 in 50 days)
            if random.random() < 0.02:
                qty *= 2
            
            consumptions_to_create.append(
                DailyConsumption(
                    consumption_id=f"C_{counter}",
                    item=item_obj,
                    raw_item_id=item_obj.item_id,
                    quantity_used=max(1, qty),
                    date=current_date,
                    department=random.choice(departments)
                )
            )
            counter += 1
            
        current_date += timedelta(days=1)
        day_count += 1
        
        # Periodic bulk saving to avoid memory issues with 730 days * 8 items
        if len(consumptions_to_create) > 3000:
            DailyConsumption.objects.bulk_create(consumptions_to_create)
            consumptions_to_create = []

    if consumptions_to_create:
        DailyConsumption.objects.bulk_create(consumptions_to_create)
        
    total = DailyConsumption.objects.count()
    print(f"Successfully generated {total} historical consumption records!")
    print("Optimization: Included Weekly/Yearly patterns for Random Forest training.")
    print("Database seeding is complete!")

if __name__ == "__main__":
    run()
