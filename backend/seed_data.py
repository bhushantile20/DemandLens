import os
import django
import random
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
        {"supplier_id": "201", "supplier_name": "FreshFarm Foods", "contact": "9876543210", "location": "Mumbai"},
        {"supplier_id": "202", "supplier_name": "MeatHub", "contact": "9123456780", "location": "Pune"},
        {"supplier_id": "203", "supplier_name": "DairyBest", "contact": "9988776655", "location": "Nashik"},
        {"supplier_id": "204", "supplier_name": "CleanCare Pvt Ltd", "contact": "9090909090", "location": "Mumbai"}
    ]
    suppliers = {}
    for data in suppliers_data:
        s = Supplier.objects.create(**data)
        suppliers[data["supplier_id"]] = s

    print("Seeding Items...")
    items_data = [
        {"item_id": "101", "item_name": "Rice", "category": "Food", "unit": "kg", "supplier_id": "201", "cost_per_unit": 60},
        {"item_id": "102", "item_name": "Chicken", "category": "Food", "unit": "kg", "supplier_id": "202", "cost_per_unit": 220},
        {"item_id": "103", "item_name": "Milk", "category": "Dairy", "unit": "liter", "supplier_id": "203", "cost_per_unit": 50},
        {"item_id": "104", "item_name": "Eggs", "category": "Dairy", "unit": "dozen", "supplier_id": "203", "cost_per_unit": 70}
    ]
    items = {}
    for data in items_data:
        sup = suppliers[data.pop("supplier_id")]
        i = InventoryItem.objects.create(supplier=sup, **data)
        items[data["item_id"]] = i

    print("Seeding Stock...")
    stock_data = [
        {"stock_id": "1", "item_id": "101", "quantity_available": 120, "reorder_level": 50},
        {"stock_id": "2", "item_id": "102", "quantity_available": 40, "reorder_level": 30},
        {"stock_id": "3", "item_id": "103", "quantity_available": 60, "reorder_level": 25},
        {"stock_id": "4", "item_id": "104", "quantity_available": 80, "reorder_level": 40}
    ]
    for data in stock_data:
        itm = items[data.pop("item_id")]
        InventoryStock.objects.create(item=itm, **data)

    print("Generating Large Historical Consumption Data (Last 120 Days)...")
    # Generate random daily consumption for the last 120 days to feed the Machine Learning model
    end_date = date.today()
    start_date = end_date - timedelta(days=120)
    
    consumptions_to_create = []
    consumption_id_counter = 401
    departments = ["Kitchen", "Housekeeping", "Bakery"]
    
    current_date = start_date
    while current_date <= end_date:
        for item_key, item_obj in items.items():
            # Randomize logic based on item type to make data look realistic
            if item_key == "101": # Rice
                qty = random.randint(10, 25)
            elif item_key == "102": # Chicken
                qty = random.randint(5, 18)
            elif item_key == "103": # Milk
                qty = random.randint(8, 15)
            else: # Eggs
                qty = random.randint(3, 10)
                
            consumptions_to_create.append(
                DailyConsumption(
                    consumption_id=str(consumption_id_counter),
                    item=item_obj,
                    raw_item_id=item_obj.item_id,
                    quantity_used=qty,
                    date=current_date,
                    department=random.choice(departments)
                )
            )
            consumption_id_counter += 1
            
        current_date += timedelta(days=1)
        
    # Bulk create for fast execution
    DailyConsumption.objects.bulk_create(consumptions_to_create)
    print(f"Successfully generated {len(consumptions_to_create)} historical consumption records!")
    print("Database seeding is complete!")

if __name__ == "__main__":
    run()
